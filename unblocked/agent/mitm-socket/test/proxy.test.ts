import { Helpers, TestLogger } from '@ulixee/unblocked-agent-testing';
import * as Proxy from 'proxy';
import * as http from 'http';
import {
  getTlsConnection,
  httpGetWithSocket,
  readableToBuffer,
} from '@ulixee/unblocked-agent-testing/helpers';
import WebSocket = require('ws');
import * as socks5 from 'simple-socks';
import { createPromise } from '@ulixee/commons/lib/utils';
import * as http2 from 'http2';
import MitmSocket from '../index';
import MitmSocketSession from '../lib/MitmSocketSession';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

let sessionId = 0;
beforeEach(() => {
  sessionId += 1;
  TestLogger.testNumber = sessionId;
});
let mitmSocketSession: MitmSocketSession;
beforeAll(() => {
  mitmSocketSession = new MitmSocketSession(TestLogger.forTest(module), {
    clientHelloId: 'chrome-83',
    rejectUnauthorized: false,
  });
  Helpers.onClose(() => mitmSocketSession.close(), true);
});

test('should be able to send a request through a proxy', async () => {
  const htmlString = 'Proxy proxy echo echo';
  const proxy = await startProxy();
  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  proxy.once('connect', connect);

  const server = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const tlsConnection = new MitmSocket(`${sessionId}`, TestLogger.forTest(module), {
    host: 'localhost',
    port: String(server.port),
    servername: 'localhost',
    proxyUrl: `http://localhost:${proxyPort}`,
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect(mitmSocketSession);

  const httpResponse = await httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket);
  expect(httpResponse).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
});

test('should be able to send a request through a secure proxy with auth', async () => {
  const htmlString = 'Proxy secure proxy echo echo';
  const password = `u:password`;
  const pass64 = Buffer.from(password).toString('base64');
  const proxyServer = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const proxy = new Proxy(proxyServer.server);
  proxy.authenticate = (
    req: http.IncomingMessage,
    cb: (req: http.IncomingMessage, success: boolean) => any,
  ) => {
    const auth = req.headers['proxy-authorization'];
    const isValid = auth === `Basic ${pass64}`;
    if (!isValid) {
      return cb(null, false);
    }
    cb(null, true);
  };
  const connect = jest.fn();
  proxy.once('connect', connect);

  const server = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const tlsConnection = getTlsConnection(server.port);
  tlsConnection.setProxyUrl(`https://${password}@localhost:${proxyServer.port}`);

  await tlsConnection.connect(mitmSocketSession);
  const httpResponse = await httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket);
  expect(httpResponse).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
});

test('should be able to send a request through a secure proxy with auth using special chars', async () => {
  const htmlString = 'Proxy secure proxy echo echo';
  const password = `u:abcDEF!123-_`;
  const pass64 = Buffer.from(password).toString('base64');
  const proxyServer = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const proxy = new Proxy(proxyServer.server);
  proxy.authenticate = (
    req: http.IncomingMessage,
    cb: (req: http.IncomingMessage, success: boolean) => any,
  ) => {
    const auth = req.headers['proxy-authorization'];
    const isValid = auth === `Basic ${pass64}`;
    if (!isValid) {
      return cb(null, false);
    }
    cb(null, true);
  };
  const connect = jest.fn();
  proxy.once('connect', connect);

  const server = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const tlsConnection = getTlsConnection(server.port);
  tlsConnection.setProxyUrl(`https://${password}@localhost:${proxyServer.port}`);

  await tlsConnection.connect(mitmSocketSession);
  const httpResponse = await httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket);
  expect(httpResponse).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
});

test('should be able to use a socks5 proxy', async () => {
  const proxy = socks5.createServer();
  await new Promise(resolve => proxy.listen(0, resolve));
  Helpers.needsClosing.push(proxy);

  const proxyPort = proxy.address().port;
  const htmlString = 'Proxy proxy echo echo';
  const connect = jest.fn();
  proxy.once('proxyConnect', connect);

  const server = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const tlsConnection = new MitmSocket(`${sessionId}`, TestLogger.forTest(module), {
    host: 'localhost',
    port: String(server.port),
    servername: 'localhost',
    proxyUrl: `socks5://localhost:${proxyPort}`,
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect(mitmSocketSession);

  const httpResponse = await httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket);
  expect(httpResponse).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
});

test('should be able to use a socks5 proxy with auth', async () => {
  const proxy = socks5.createServer({
    authenticate(username, password, socket, callback) {
      // verify username/password
      if (username !== 'foo' || password !== 'bar') {
        // respond with auth failure (can be any error)
        return setImmediate(callback, new Error('invalid credentials'));
      }

      // return successful authentication
      return setImmediate(callback);
    },
  });
  await new Promise(resolve => proxy.listen(0, resolve));
  Helpers.needsClosing.push(proxy);

  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  const auth = jest.fn();
  proxy.once('proxyConnect', connect);
  proxy.once('authenticate', auth);

  const htmlString = 'Proxy proxy echo auth';
  const server = await Helpers.runHttp2Server((req, res) => res.end(htmlString));
  const tlsConnection = new MitmSocket(`${sessionId}`, TestLogger.forTest(module), {
    host: 'localhost',
    port: String(server.port),
    servername: 'localhost',
    proxyUrl: `socks5://foo:bar@localhost:${proxyPort}`,
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect(mitmSocketSession);

  const client = http2.connect(server.baseUrl, {
    createConnection: () => tlsConnection.socket,
  });
  Helpers.onClose(async () => client.close());

  const h2stream = client.request({ ':path': '/' });
  const httpResponse = await readableToBuffer(h2stream);

  expect(httpResponse.toString()).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
  expect(auth).toHaveBeenCalledTimes(1);
});


test('should be able to use a socks5 proxy with auth, using special characters', async () => {
  const proxy = socks5.createServer({
    authenticate(username, password, socket, callback) {
      // verify username/password
      if (username !== 'abcDEF!123-_' || password !== 'GHI_jkl-456!!') {
        // respond with auth failure (can be any error)
        return setImmediate(callback, new Error('invalid credentials'));
      }

      // return successful authentication
      return setImmediate(callback);
    },
  });
  await new Promise(resolve => proxy.listen(0, resolve));
  Helpers.needsClosing.push(proxy);

  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  const auth = jest.fn();
  proxy.once('proxyConnect', connect);
  proxy.once('authenticate', auth);

  const htmlString = 'Proxy proxy echo auth';
  const server = await Helpers.runHttp2Server((req, res) => res.end(htmlString));
  const tlsConnection = new MitmSocket(`${sessionId}`, TestLogger.forTest(module), {
    host: 'localhost',
    port: String(server.port),
    servername: 'localhost',
    proxyUrl: `socks5://abcDEF!123-_:GHI_jkl-456!!@localhost:${proxyPort}`,
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect(mitmSocketSession);

  const client = http2.connect(server.baseUrl, {
    createConnection: () => tlsConnection.socket,
  });
  Helpers.onClose(async () => client.close());

  const h2stream = client.request({ ':path': '/' });
  const httpResponse = await readableToBuffer(h2stream);

  expect(httpResponse.toString()).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
  expect(auth).toHaveBeenCalledTimes(1);
});

test('should handle websockets over proxies', async () => {
  const proxy = await startProxy();
  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  proxy.once('connect', connect);

  const server = await Helpers.runHttpsServer((req, res) => res.end(''));
  const serverPort = server.port;

  const wsServer = new WebSocket.Server({ server: server.server });
  wsServer.on('connection', async (ws: WebSocket) => {
    ws.send('ola');
  });

  const tlsConnection = getTlsConnection(serverPort, undefined, true);
  tlsConnection.connectOpts.keepAlive = true;
  tlsConnection.setProxyUrl(`http://localhost:${proxyPort}`);
  await tlsConnection.connect(mitmSocketSession);

  const wsClient = new WebSocket(`wss://localhost:${serverPort}`, {
    rejectUnauthorized: false,
    createConnection: () => tlsConnection.socket,
  });

  Helpers.onClose(async () => wsClient.close());
  await new Promise<void>(resolve => {
    wsClient.once('message', msg => {
      expect(msg).toBe('ola');
      resolve();
    });
  });
  expect(connect).toHaveBeenCalledTimes(1);
});

async function startProxy() {
  const proxyPromise = createPromise();
  const proxy = new Proxy(http.createServer());
  proxy.listen(0, () => {
    proxyPromise.resolve();
  });
  proxy.unref();

  closeAfterTest(proxy);
  await proxyPromise.promise;
  return proxy;
}

function closeAfterTest(closable: { close: (...args: any[]) => any }) {
  Helpers.onClose(() => new Promise(resolve => closable.close(() => process.nextTick(resolve))));
}
