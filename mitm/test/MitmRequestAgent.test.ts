import { Helpers } from '@secret-agent/testing';
import { getProxyAgent, runHttpsServer } from '@secret-agent/testing/helpers';
import * as WebSocket from 'ws';
import * as HttpProxyAgent from 'http-proxy-agent';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { URL } from 'url';
import * as https from 'https';
import * as net from 'net';
import MitmServer from '../lib/MitmProxy';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';
import MitmRequestAgent from '../lib/MitmRequestAgent';

const mocks = {
  HeadersHandler: {
    determineResourceType: jest.spyOn(HeadersHandler, 'determineResourceType'),
  },
};

beforeAll(() => {
  mocks.HeadersHandler.determineResourceType.mockImplementation(async () => {
    return {
      resourceType: 'Document',
    } as any;
  });
});

beforeEach(() => {
  process.env.MITM_ALLOW_INSECURE = 'false';
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should create up to a max number of secure connections per origin', async () => {
  const remotePorts: number[] = [];
  MitmRequestAgent.defaultMaxConnectionsPerOrigin = 2;
  const server = await runHttpsServer((req, res) => {
    remotePorts.push(req.connection.remotePort);
    res.socket.setKeepAlive(true);
    res.end('I am here');
  });
  const mitmServer = await startMitmServer();

  const session = createMitmSession();

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const proxyCredentials = session.getProxyCredentials();
  process.env.MITM_ALLOW_INSECURE = 'true';
  const promises = [];
  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line jest/valid-expect-in-promise
    const p = Helpers.httpGet(
      server.baseUrl,
      `http://localhost:${mitmServer.port}`,
      proxyCredentials,
      { connection: 'keep-alive' },
    ).then(
      // eslint-disable-next-line promise/always-return
      res => {
        expect(res).toBe('I am here');
      },
    );
    promises.push(p);
  }
  await Promise.all(promises);

  expect(connectionsByOrigin[server.baseUrl].all.size).toBe(2);
  await session.close();
  const uniquePorts = new Set<number>(remotePorts);
  expect(uniquePorts.size).toBe(2);
});

test('should create new connections as needed when no keepalive', async () => {
  const remotePorts: number[] = [];
  MitmRequestAgent.defaultMaxConnectionsPerOrigin = 1;
  const server = await runHttpsServer((req, res) => {
    remotePorts.push(req.connection.remotePort);
    res.end('here 2');
  });
  const mitmServer = await startMitmServer();

  const session = createMitmSession();

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const proxyCredentials = session.getProxyCredentials();
  process.env.MITM_ALLOW_INSECURE = 'true';
  const promises = [];
  for (let i = 0; i < 4; i += 1) {
    // eslint-disable-next-line jest/valid-expect-in-promise
    const p = Helpers.httpGet(
      server.baseUrl,
      `http://localhost:${mitmServer.port}`,
      proxyCredentials,
    ).then(
      // eslint-disable-next-line promise/always-return
      res => {
        expect(res).toBe('here 2');
      },
    );

    promises.push(p);
  }
  await Promise.all(promises);

  // they all close after use, so should be gone now
  expect(connectionsByOrigin[server.baseUrl].all.size).toBe(0);

  await session.close();
  const uniquePorts = new Set<number>(remotePorts);
  expect(uniquePorts.size).toBe(4);
});

test('should be able to handle a reused socket that closes on server', async () => {
  let serverSocket: net.Socket;
  const sockets = new Set<net.Socket>();
  const server = await Helpers.runHttpsServer(async (req, res) => {
    res.writeHead(200, { Connection: 'keep-alive' });
    res.end('Looks good');
    serverSocket = res.socket;
    sockets.add(res.socket);
  });
  const mitmServer = await startMitmServer();

  const session = createMitmSession();
  const proxyCredentials = session.getProxyCredentials();
  process.env.MITM_ALLOW_INSECURE = 'true';

  {
    let headers: IncomingHttpHeaders;
    const response = await Helpers.httpRequest(
      server.baseUrl,
      'GET',
      `http://localhost:${mitmServer.port}`,
      proxyCredentials,
      {
        connection: 'keep-alive',
      },
      res => {
        headers = res.headers;
      },
    );
    expect(headers.connection).toBe('keep-alive');
    expect(response).toBe('Looks good');
  }

  // @ts-ignore
  const originalFn = session.requestAgent.http1Request.bind(session.requestAgent);

  const httpRequestSpy = jest.spyOn<any, any>(session.requestAgent, 'http1Request');
  httpRequestSpy.mockImplementationOnce(async (ctx, settings) => {
    serverSocket.destroy();
    await new Promise(setImmediate);
    return await originalFn(ctx, settings);
  });

  {
    const request = https.request({
      host: 'localhost',
      port: server.port,
      method: 'GET',
      path: '/',
      headers: {
        connection: 'keep-alive',
      },
      rejectUnauthorized: false,
      agent: getProxyAgent(
        new URL(server.baseUrl),
        `http://localhost:${mitmServer.port}`,
        proxyCredentials,
      ),
    });
    const responseP = new Promise<IncomingMessage>(resolve => request.on('response', resolve));
    request.end();
    const response = await responseP;
    expect(response.headers.connection).toBe('keep-alive');
    const body = [];
    for await (const chunk of response) {
      body.push(chunk.toString());
    }
    expect(body.join('')).toBe('Looks good');
  }

  expect(sockets.size).toBe(2);
  expect(httpRequestSpy).toHaveBeenCalledTimes(2);
  httpRequestSpy.mockClear();
});

test('it should not put upgrade connections in a pool', async () => {
  const httpServer = await Helpers.runHttpServer();
  const mitmServer = await startMitmServer();
  const wsServer = new WebSocket.Server({ noServer: true });

  const session = createMitmSession();

  httpServer.server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
      expect(ws).toBeTruthy();
    });
  });

  const wsClient = new WebSocket(`ws://localhost:${httpServer.port}`, {
    agent: HttpProxyAgent({
      host: 'localhost',
      port: mitmServer.port,
      auth: session.getProxyCredentials(),
    }),
  });
  Helpers.onClose(async () => wsClient.close());

  await new Promise(resolve => wsClient.on('open', resolve));

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;
  expect(connectionsByOrigin[`ws://localhost:${httpServer.port}`].all.size).toBe(0);
});

test('it should reuse http2 connections', async () => {
  const httpServer = await Helpers.runHttp2Server((request, response) => {
    response.end(request.url);
  });
  const baseUrl = httpServer.baseUrl;

  const mitmServer = await startMitmServer();
  const mitmUrl = `http://localhost:${mitmServer.port}`;
  const session = createMitmSession();

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const proxyCredentials = session.getProxyCredentials();

  process.env.MITM_ALLOW_INSECURE = 'true';
  const results = await Promise.all([
    Helpers.httpGet(`${baseUrl}/test1`, mitmUrl, proxyCredentials),
    Helpers.httpGet(`${baseUrl}/test2`, mitmUrl, proxyCredentials),
    Helpers.httpGet(`${baseUrl}/test3`, mitmUrl, proxyCredentials),
  ]);
  expect(results).toStrictEqual(['/test1', '/test2', '/test3']);

  process.env.MITM_ALLOW_INSECURE = 'false';
  // not reusable, so should not be here
  expect(connectionsByOrigin[baseUrl].all.size).toBe(0);
  // @ts-ignore
  expect(session.requestAgent.http2Sessions).toHaveLength(1);
});

async function startMitmServer() {
  const mitmServer = await MitmServer.start();
  Helpers.onClose(() => mitmServer.close());
  return mitmServer;
}

let counter = 1;
function createMitmSession() {
  counter += 1;
  return new RequestSession(`${counter}`, 'any agent', null);
}
