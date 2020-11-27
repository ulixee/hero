import { Helpers } from '@secret-agent/testing';
import Proxy from 'proxy';
import * as http from 'http';
import {
  getTlsConnection,
  httpGetWithSocket,
  readableToBuffer,
} from '@secret-agent/testing/helpers';
import WebSocket from 'ws';
import socks5 from 'simple-socks';
import { createPromise } from '@secret-agent/commons/utils';
import http2 from 'http2';
import MitmSocket from '../index';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

let sessionId = 0;

test('should be able to send a request through a proxy', async () => {
  const htmlString = 'Proxy proxy echo echo';
  const proxy = await startProxy();
  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  proxy.once('connect', connect);

  const server = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const tlsConnection = new MitmSocket(`${(sessionId += 1)}`, {
    host: 'localhost',
    port: String(server.port),
    clientHelloId: 'Chrome83',
    servername: 'localhost',
    proxyUrl: `http://localhost:${proxyPort}`,
    rejectUnauthorized: false,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect();

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
  tlsConnection.setProxy(proxyServer.baseUrl, password);

  await tlsConnection.connect();
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
  const tlsConnection = new MitmSocket(`${(sessionId += 1)}`, {
    host: 'localhost',
    port: String(server.port),
    clientHelloId: 'Chrome83',
    servername: 'localhost',
    proxyUrl: `socks5://localhost:${proxyPort}`,
    rejectUnauthorized: false,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect();

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
  const tlsConnection = new MitmSocket(`${(sessionId += 1)}`, {
    host: 'localhost',
    port: String(server.port),
    clientHelloId: 'Chrome83',
    servername: 'localhost',
    proxyUrl: `socks5://localhost:${proxyPort}`,
    proxyAuth: 'foo:bar',
    rejectUnauthorized: false,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect();

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

  const tlsConnection = getTlsConnection(serverPort);
  tlsConnection.connectOpts.keepAlive = true;
  tlsConnection.setProxy(`http://localhost:${proxyPort}`);
  await tlsConnection.connect();

  const wsClient = new WebSocket(`wss://localhost:${serverPort}`, {
    rejectUnauthorized: false,
    createConnection: () => tlsConnection.socket,
  });

  Helpers.onClose(async () => wsClient.close());
  await new Promise(resolve => {
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
