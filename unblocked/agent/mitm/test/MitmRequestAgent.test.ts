import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { URL } from 'url';
import * as https from 'https';
import * as net from 'net';
import * as WebSocket from 'ws';
import * as HttpProxyAgent from 'http-proxy-agent';
import { Helpers, TestLogger } from '@unblocked-web/agent-testing';
import { getProxyAgent, runHttpsServer } from '@unblocked-web/agent-testing/helpers';
import CertificateGenerator from '@unblocked-web/agent-mitm-socket/lib/CertificateGenerator';
import MitmServer from '../lib/MitmProxy';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';
import MitmRequestAgent from '../lib/MitmRequestAgent';
import { MitmProxy } from '../index';

const mocks = {
  HeadersHandler: {
    determineResourceType: jest.spyOn(HeadersHandler, 'determineResourceType'),
  },
};

let certificateGenerator: CertificateGenerator;

beforeAll(() => {
  certificateGenerator = MitmProxy.createCertificateGenerator();
  mocks.HeadersHandler.determineResourceType.mockImplementation(async () => {
    return {
      resourceType: 'Document',
    } as any;
  });
});

beforeEach(() => {
  TestLogger.testNumber += 1;
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

  const session = createMitmSession(mitmServer);

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const proxyCredentials = session.getProxyCredentials();
  const promises = [];
  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line jest/valid-expect-in-promise
    const p = Helpers.httpGet(
      server.baseUrl,
      `http://localhost:${mitmServer.port}`,
      proxyCredentials,
      { connection: 'keep-alive' },
    ).then(
      // eslint-disable-next-line promise/always-return,@typescript-eslint/no-floating-promises
      res => {
        expect(res).toBe('I am here');
      },
    );
    promises.push(p);
  }
  await Promise.all(promises);

  const host = server.baseUrl.replace('https://', '');
  // @ts-ignore
  expect(connectionsByOrigin.get(host).pooled).toBe(2);
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

  const session = createMitmSession(mitmServer);

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const proxyCredentials = session.getProxyCredentials();
  const promises = [];
  for (let i = 0; i < 4; i += 1) {
    // eslint-disable-next-line jest/valid-expect-in-promise
    const p = Helpers.httpGet(
      server.baseUrl,
      `http://localhost:${mitmServer.port}`,
      proxyCredentials,
    ).then(
      // eslint-disable-next-line promise/always-return,@typescript-eslint/no-floating-promises
      res => {
        expect(res).toBe('here 2');
      },
    );

    promises.push(p);
  }
  await Promise.all(promises);

  const host = server.baseUrl.replace('https://', '');
  // they all close after use, so should be gone now
  // @ts-ignore
  expect(connectionsByOrigin.get(host).pooled).toBe(0);

  await session.close();
  const uniquePorts = new Set<number>(remotePorts);
  expect(uniquePorts.size).toBe(4);
});

test('should be able to handle a reused socket that closes on server', async () => {
  MitmRequestAgent.defaultMaxConnectionsPerOrigin = 1;
  let serverSocket: net.Socket;
  const sockets = new Set<net.Socket>();
  const server = await Helpers.runHttpsServer(async (req, res) => {
    res.writeHead(200, { Connection: 'keep-alive' });
    res.end('Looks good');
    serverSocket = res.socket;
    sockets.add(res.socket);
  });
  const mitmServer = await startMitmServer();

  const session = createMitmSession(mitmServer);
  const proxyCredentials = session.getProxyCredentials();

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
    return await originalFn(ctx as any, settings);
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

  const session = createMitmSession(mitmServer);

  httpServer.server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket as net.Socket, head, async (ws: WebSocket) => {
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
  const pool = session.requestAgent.socketPoolByOrigin.get(`localhost:${httpServer.port}`);
  // @ts-ignore
  expect(pool.pooled).toBe(0);
});

test('it should reuse http2 connections', async () => {
  MitmRequestAgent.defaultMaxConnectionsPerOrigin = 4;
  const httpServer = await Helpers.runHttp2Server((request, response) => {
    response.end(request.url);
  });
  const baseUrl = httpServer.baseUrl;

  const mitmServer = await startMitmServer();
  const session = createMitmSession(mitmServer);

  // @ts-ignore
  const pool = session.requestAgent.socketPoolByOrigin;

  const proxyCredentials = session.getProxyCredentials();

  const proxyUrl = `http://${proxyCredentials}@localhost:${mitmServer.port}`;
  const results = await Promise.all([
    Helpers.http2Get(baseUrl, { ':path': '/test1' }, session.sessionId, proxyUrl),
    Helpers.http2Get(baseUrl, { ':path': '/test2' }, session.sessionId, proxyUrl),
    Helpers.http2Get(baseUrl, { ':path': '/test3' }, session.sessionId, proxyUrl),
  ]);
  expect(results).toStrictEqual(['/test1', '/test2', '/test3']);

  const host = baseUrl.replace('https://', '');
  // not reusable, so should not be here
  // @ts-ignore
  expect(pool.get(host).pooled).toBe(0);
  // @ts-ignore
  expect(pool.get(host).http2Sessions).toHaveLength(1);
});

async function startMitmServer() {
  const mitmServer = await MitmServer.start(certificateGenerator);
  Helpers.onClose(() => mitmServer.close());
  return mitmServer;
}

let counter = 1;
function createMitmSession(mitmServer: MitmServer) {
  counter += 1;
  const session = new RequestSession(`${counter}`, {}, TestLogger.forTest(module));
  mitmServer.registerSession(session, false);
  return session;
}
