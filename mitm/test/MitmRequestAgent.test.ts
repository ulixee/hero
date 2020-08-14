import { Helpers } from '@secret-agent/testing';
import MitmServer from '../lib/MitmProxy';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';
import MitmRequestAgent from '../lib/MitmRequestAgent';
import { runHttpsServer } from '@secret-agent/testing/helpers';
import WebSocket from 'ws';
import HttpProxyAgent from 'http-proxy-agent';
import { createPromise } from '../../commons/utils';
import http2 from 'http2';
import * as net from 'net';

const mocks = {
  HeadersHandler: {
    waitForResource: jest.spyOn(HeadersHandler, 'waitForResource'),
  },
};

beforeAll(() => {
  mocks.HeadersHandler.waitForResource.mockImplementation(async args => {
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

  const session = new RequestSession('1', 'any agent', null);

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const headers = session.getTrackingHeaders();
  headers.connection = 'keep-alive';
  process.env.MITM_ALLOW_INSECURE = 'true';
  const promises = [];
  for (let i = 0; i < 10; i += 1) {
    const p = Helpers.httpGet(server.baseUrl, `http://localhost:${mitmServer.port}`, headers).then(
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

  const session = new RequestSession('1', 'any agent', null);

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const headers = session.getTrackingHeaders();
  process.env.MITM_ALLOW_INSECURE = 'true';
  const promises = [];
  for (let i = 0; i < 4; i += 1) {
    const p = Helpers.httpGet(server.baseUrl, `http://localhost:${mitmServer.port}`, headers).then(
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
  const session = new RequestSession('4', 'any agent', null);

  httpServer.server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
      expect(ws).toBeTruthy();
    });
  });

  const wsClient = new WebSocket(`ws://localhost:${httpServer.port}`, {
    agent: HttpProxyAgent(`http://localhost:${mitmServer.port}`),
    headers: session.getTrackingHeaders(),
  });
  Helpers.onClose(async () => wsClient.close());

  await new Promise(r => wsClient.on('open', r));

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;
  expect(connectionsByOrigin[`ws://localhost:${httpServer.port}`].all.size).toBe(0);
});

test('it should reuse http2 connections', async () => {
  const h2ServerStarted = createPromise();
  const httpServer = http2
    .createSecureServer(Helpers.sslCerts(), (request, response) => {
      response.end(request.url);
    })
    .listen(0, () => {
      h2ServerStarted.resolve();
    });
  Helpers.onClose(() => new Promise(resolve => httpServer.close(resolve)));
  await h2ServerStarted.promise;
  const serverPort = (httpServer.address() as net.AddressInfo).port;
  const baseUrl = `https://localhost:${serverPort}`;

  const mitmServer = await startMitmServer();
  const mitmUrl = `http://localhost:${mitmServer.port}`;
  const session = new RequestSession('1', 'any agent', null);

  // @ts-ignore
  const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;

  const headers = session.getTrackingHeaders();

  const results = await Promise.all([
    Helpers.httpGet(`${baseUrl}/test1`, mitmUrl, headers),
    Helpers.httpGet(`${baseUrl}/test2`, mitmUrl, headers),
    Helpers.httpGet(`${baseUrl}/test3`, mitmUrl, headers),
  ]);
  expect(results).toStrictEqual(['/test1', '/test2', '/test3']);

  // not reusable, so should not be here
  expect(connectionsByOrigin[baseUrl].all.size).toBe(0);
  // @ts-ignore
  expect(session.requestAgent.http2Sessions).toHaveLength(1);
});

async function startMitmServer() {
  const mitmServer = await MitmServer.start(0);
  Helpers.onClose(() => mitmServer.close());
  return mitmServer;
}
