import { Helpers } from '@secret-agent/testing';
import { createPromise } from '@secret-agent/commons/utils';
import * as http2 from 'http2';
import * as stream from 'stream';
import * as WebSocket from 'ws';
import { getTlsConnection, httpGetWithSocket } from '@secret-agent/testing/helpers';
import MitmSocket from '../index';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should be able to send a tls connection', async () => {
  const htmlString = 'Secure as anything!';
  const server = await Helpers.runHttpsServer((req, res) => {
    return res.end(htmlString);
  });

  const tlsConnection = getTlsConnection(server.port);
  await tlsConnection.connect();
  const httpResponse = await httpGetWithSocket(`${server.baseUrl}/any`, {}, tlsConnection.socket);
  expect(httpResponse).toBe(htmlString);
});

test('should handle http2 requests', async () => {
  const httpServer = await Helpers.runHttp2Server((request, response) => {
    response.end('I am h2');
  });
  const tlsConnection = getTlsConnection(httpServer.port);

  await tlsConnection.connect();
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://secretagent.dev', {
    createConnection: () => tlsConnection.socket,
  });
  closeAfterTest(client);

  const request = client.request({ ':path': '/' });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBe('I am h2');
});

test('should be able to hit google using a Chrome Emulator', async () => {
  const tlsConnection = new MitmSocket('1', {
    host: 'google.com',
    port: '443',
    clientHelloId: 'Chrome79',
    servername: 'google.com',
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect();
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
    clientHelloId: 'Chrome72',
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect();
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

// only test this manually
// eslint-disable-next-line jest/no-disabled-tests
test.skip('should be able to get scripts from unpkg using Chrome emulator', async () => {
  const tlsConnection = new MitmSocket('3', {
    host: 'unpkg.com',
    port: '443',
    clientHelloId: 'Chrome79',
    servername: 'unpkg.com',
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect();
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

  const tlsConnection = getTlsConnection(server.port);
  tlsConnection.connectOpts.keepAlive = true;
  await tlsConnection.connect();

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
  await tlsConnection.connect();

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
