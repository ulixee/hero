import { Helpers } from '@secret-agent/testing';
import { runHttpsServer } from '@secret-agent/testing/helpers';
import * as WebSocket from 'ws';
import * as HttpProxyAgent from 'http-proxy-agent';
import MitmServer from '../lib/MitmProxy';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';
import MitmRequestAgent from '../lib/MitmRequestAgent';

const mocks = {
  HeadersHandler: {
    waitForResource: jest.spyOn(HeadersHandler, 'waitForBrowserRequest'),
  },
};

beforeAll(() => {
  mocks.HeadersHandler.waitForResource.mockImplementation(async () => {
    return {
      resourceType: 'Document',
    } as any;
  });
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should create up to a max number of secure connections per origin', async () => {
  const remotePorts: number[] = [];
  MitmRequestAgent.defaultMaxConnectionsPerOrigin = 2;
  const server = await runHttpsServer((req, res) => {
    remotePorts.push(req.connection.remotePort);
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
  process.env.MITM_ALLOW_INSECURE = 'false';

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
  process.env.MITM_ALLOW_INSECURE = 'false';

  // they all close after use, so should be gone now
  expect(connectionsByOrigin[server.baseUrl].all.size).toBe(0);

  await session.close();
  const uniquePorts = new Set<number>(remotePorts);
  expect(uniquePorts.size).toBe(4);
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
