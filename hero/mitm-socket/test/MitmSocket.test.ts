import { Helpers } from '@secret-agent/testing';
import { createPromise } from '@secret-agent/commons/utils';
import * as http2 from 'http2';
import * as stream from 'stream';
import * as WebSocket from 'ws';
import { getTlsConnection, httpGetWithSocket } from '@secret-agent/testing/helpers';
import * as https from 'https';
import { IncomingMessage } from 'http';
import MitmSocket from '../index';
import MitmSocketSession from '../lib/MitmSocketSession';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

let mitmSocketSession: MitmSocketSession;
beforeAll(() => {
  mitmSocketSession = new MitmSocketSession('mitmSocket.test', {
    clientHelloId: 'chrome-72',
    rejectUnauthorized: false,
  });
  Helpers.onClose(() => mitmSocketSession.close(), true);
});

test('should be able to send a tls connection', async () => {
  const htmlString = 'Secure as anything!';
  const server = await Helpers.runHttpsServer((req, res) => {
    return res.end(htmlString);
  });

  const tlsConnection = getTlsConnection(server.port);
  await tlsConnection.connect(mitmSocketSession);
  const httpResponse = await httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket);
  expect(httpResponse).toBe(htmlString);
});

test('should handle http2 requests', async () => {
  const httpServer = await Helpers.runHttp2Server((request, response) => {
    response.end('I am h2');
  });
  const tlsConnection = getTlsConnection(httpServer.port);

  await tlsConnection.connect(mitmSocketSession);
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://secretagent.dev', {
    createConnection: () => tlsConnection.socket,
  });
  closeAfterTest(client);

  const request = client.request({ ':path': '/' });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBe('I am h2');
  client.destroy();
});

test('should be able to hit google using a Chrome Emulator', async () => {
  const socketSession = new MitmSocketSession('mitmSocket.test', {
    clientHelloId: 'chrome-79',
    rejectUnauthorized: false,
  });
  Helpers.needsClosing.push(socketSession);
  const tlsConnection = new MitmSocket('1', {
    host: 'google.com',
    port: '443',
    servername: 'google.com',
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect(socketSession);
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://www.google.com', {
    createConnection: () => tlsConnection.socket,
  });
  closeAfterTest(client);

  const request = client.request({ ':path': '/' });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBeTruthy();
  expect(httpResponse).toMatch(/<\/body><\/html>$/);
});

test('should be able to hit gstatic using a Chrome Emulator', async () => {
  const tlsConnection = new MitmSocket('optimove', {
    host: 'www.gstatic.com',
    port: '443',
    servername: 'www.gstatic.com',
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect(mitmSocketSession);
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://www.gstatic.com', {
    createConnection: () => tlsConnection.socket,
  });
  closeAfterTest(client);

  const request = client.request({
    ':path': '/firebasejs/4.9.1/firebase.js',
  });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBeTruthy();
});

test('should be able to hit a server that disconnects', async () => {
  const server = await Helpers.runHttpsServer(async (req, res) => {
    res.socket.end(
      `HTTP/1.1 301 Moved Permanently\r\nContent-Length: 0\r\nConnection: close\r\nLocation: https://www.location2.com\r\n\r\n`,
    );
  });

  const tlsConnection = new MitmSocket('disconnect', {
    host: `localhost`,
    port: String(server.port),
    servername: 'localhost',
    keepAlive: true,
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect(mitmSocketSession);
  expect(tlsConnection.alpn).toBe('http/1.1');
  const request = https.request({
    method: 'GET',
    path: '/',
    host: 'localhost',
    port: server.port,
    createConnection() {
      return tlsConnection.socket;
    },
  });

  const responsePromise = new Promise<IncomingMessage>(resolve => request.on('response', resolve));
  request.end();
  const response = await responsePromise;
  expect(response.headers).toEqual({
    'content-length': '0',
    connection: 'close',
    location: 'https://www.location2.com',
  });
});

// only test this manually
// eslint-disable-next-line jest/no-disabled-tests
test.skip('should be able to get scripts from unpkg using Chrome emulator', async () => {
  const socketSession = new MitmSocketSession('mitmSocket.test', {
    clientHelloId: 'chrome-79',
    rejectUnauthorized: false,
  });
  Helpers.needsClosing.push(socketSession);
  const tlsConnection = new MitmSocket('3', {
    host: 'unpkg.com',
    port: '443',
    servername: 'unpkg.com',
    isSsl: true,
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect(socketSession);
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://unpkg.com', {
    createConnection: () => tlsConnection.socket,
  });
  closeAfterTest(client);

  {
    const request = client.request({ ':path': '/react@16.7.0/umd/react.production.min.js' });
    const httpResponse = await readResponse(request);
    expect(httpResponse).toBeTruthy();
    expect(httpResponse).toMatch(/\(function\(/);
  }
  {
    const request = client.request({
      ':path': '/react-dom@16.7.0/umd/react-dom.production.min.js',
    });
    const httpResponse = await readResponse(request);
    expect(httpResponse).toBeTruthy();
    expect(httpResponse).toMatch(/\(function\(/);
  }
});

test('should handle websockets', async () => {
  const htmlString = 'Secure as anything!';
  const server = await Helpers.runHttpsServer((req, res) => res.end(htmlString));
  const messageCount = 500;

  const wsServer = new WebSocket.Server({ server: server.server });
  wsServer.on('connection', async (ws: WebSocket) => {
    for (let i = 0; i < messageCount; i += 1) {
      await new Promise(resolve =>
        ws.send(i, () => {
          setTimeout(resolve, 2);
        }),
      );
    }
  });

  const tlsConnection = getTlsConnection(server.port, undefined, true);
  tlsConnection.connectOpts.keepAlive = true;
  await tlsConnection.connect(mitmSocketSession);

  const wsClient = new WebSocket(`wss://localhost:${server.port}`, {
    rejectUnauthorized: false,
    createConnection: () => tlsConnection.socket,
  });

  Helpers.onClose(async () => wsClient.close());

  const messages = [];
  const messagePromise = createPromise();
  wsClient.on('open', () => {
    wsClient.on('message', msg => {
      messages.push(msg);
      if (messages.length === messageCount) {
        messagePromise.resolve();
      }
    });
  });
  await messagePromise.promise;
  expect(messages.length).toBe(messageCount);
}, 35e3);

test('should handle upstream disconnects', async () => {
  const server = await Helpers.runHttpsServer((req, res) => {
    res.connection.end();
  });

  const tlsConnection = getTlsConnection(server.port);
  await tlsConnection.connect(mitmSocketSession);

  await expect(
    httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket),
  ).rejects.toThrow();
});

function closeAfterTest(session: http2.ClientHttp2Session) {
  Helpers.onClose(() => {
    session.destroy();
  });
}

async function readResponse(res: stream.Readable) {
  return (await Helpers.readableToBuffer(res)).toString();
}
