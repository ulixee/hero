import { Helpers } from '@secret-agent/shared-testing';
import SocketConnectDriver from '../lib/SocketConnectDriver';
import * as fs from 'fs';
import * as https from 'https';
import * as net from 'net';
import { createPromise } from '@secret-agent/commons/utils';
import http2 from 'http2';
import * as stream from 'stream';
import Proxy from 'proxy';
import * as http from 'http';
import WebSocket from 'ws';

afterEach(async () => {
  await Helpers.closeAll();
});

test('should be able to send a tls connection', async () => {
  const htmlString = 'Secure as anything!';
  const serverPort = await createHttpsServer(() => htmlString);

  const tlsConnection = getTlsConnection(serverPort);
  await tlsConnection.connect();
  const httpResponse = await httpGetWithSocket(
    `https://localhost:${serverPort}/any`,
    {},
    tlsConnection.socket,
  );
  expect(httpResponse).toBe(htmlString);
});

test('should handle http2 requests', async () => {
  const h2ServerStarted = createPromise();
  const httpServer = http2
    .createSecureServer(
      {
        key: fs.readFileSync(`${__dirname}/certs/key.pem`),
        cert: fs.readFileSync(`${__dirname}/certs/cert.pem`),
      },
      (request, response) => {
        response.end('I am h2');
      },
    )
    .listen(0, () => {
      h2ServerStarted.resolve();
    });
  Helpers.onClose(() => new Promise(resolve => httpServer.close(resolve)));
  await h2ServerStarted.promise;
  const serverPort = (httpServer.address() as net.AddressInfo).port;

  const tlsConnection = getTlsConnection(serverPort);

  await tlsConnection.connect();
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://www.google.com', {
    createConnection: () => tlsConnection.socket,
  });
  Helpers.onClose(() => new Promise(resolve => client.close(resolve)));

  const request = client.request({ ':path': '/' });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBe('I am h2');
});

test('should be able to hit google using a Chrome79 Emulator', async () => {
  const tlsConnection = new SocketConnectDriver({
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
  Helpers.onClose(() => new Promise(resolve => client.close(resolve)));

  const request = client.request({ ':path': '/' });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBeTruthy();
  expect(httpResponse).toMatch(/<\/body><\/html>$/);
});

test('should be able to hit optimove using a Chrome79 Emulator', async () => {
  const tlsConnection = new SocketConnectDriver({
    host: 'www.gstatic.com',
    port: '443',
    servername: 'www.gstatic.com',
    clientHelloId: 'Chrome72',
    debug: true,
  });
  Helpers.onClose(async () => tlsConnection.close());

  await tlsConnection.connect();
  expect(tlsConnection.alpn).toBe('h2');

  const client = http2.connect('https://www.gstatic.com', {
    createConnection: () => tlsConnection.socket,
  });
  Helpers.onClose(() => new Promise(resolve => client.close(resolve)));

  const request = client.request({
    ':path': '/firebasejs/4.9.1/firebase.js',
  });
  const httpResponse = await readResponse(request);
  expect(httpResponse).toBeTruthy();
});

// only test this manually
test.skip('should be able to get scripts from unpkg using Chrome79 emulator', async () => {
  const tlsConnection = new SocketConnectDriver({
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
  trackClose(client);

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

test('should be able to send a request through a proxy', async () => {
  const htmlString = 'Proxy proxy echo echo';
  const proxy = await startProxy();
  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  proxy.once('connect', connect);

  const serverPort = await createHttpsServer(() => htmlString);
  const tlsConnection = new SocketConnectDriver({
    host: 'localhost',
    port: String(serverPort),
    clientHelloId: 'Chrome79',
    servername: 'localhost',
    proxyUrl: `http://localhost:${proxyPort}`,
    rejectUnauthorized: false,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect();

  const httpResponse = await httpGetWithSocket(
    `https://localhost:${serverPort}/any`,
    {},
    tlsConnection.socket,
  );
  expect(httpResponse).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
});

test('should be able to send a request through a secure proxy with auth', async () => {
  const htmlString = 'Proxy secure proxy echo echo';
  const password = `u:password`;
  const pass64 = Buffer.from(password).toString('base64');
  const server = await startHttpsServer(() => htmlString);
  const proxy = new Proxy(server);
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

  const serverPort = await createHttpsServer(() => htmlString);
  const tlsConnection = getTlsConnection(serverPort);
  tlsConnection.setProxy(`https://localhost:${getPort(server)}`, password);

  await tlsConnection.connect();
  const httpResponse = await httpGetWithSocket(
    `https://localhost:${serverPort}/any`,
    {},
    tlsConnection.socket,
  );
  expect(httpResponse).toBe(htmlString);
  expect(connect).toHaveBeenCalledTimes(1);
});

test('should handle websockets', async () => {
  const htmlString = 'Secure as anything!';
  const server = await startHttpsServer(() => htmlString);
  const serverPort = getPort(server);
  const messageCount = 500;

  const wsServer = new WebSocket.Server({ server });
  wsServer.on('connection', async (ws: WebSocket) => {
    for (let i = 0; i < messageCount; i += 1) {
      await new Promise(resolve =>
        ws.send(i, () => {
          setTimeout(resolve, 2);
        }),
      );
    }
  });

  const tlsConnection = getTlsConnection(serverPort);
  tlsConnection.connectOpts.keepAlive = true;
  await tlsConnection.connect();

  const wsClient = new WebSocket(`wss://localhost:${serverPort}`, {
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
}, 35e3);

test('should handle websockets over proxies', async () => {
  const proxy = await startProxy();
  const proxyPort = proxy.address().port;
  const connect = jest.fn();
  proxy.once('connect', connect);

  const server = await startHttpsServer(() => '');
  const serverPort = getPort(server);

  const wsServer = new WebSocket.Server({ server });
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

test('should handle upstream disconnects', async () => {
  const options = {
    key: fs.readFileSync(`${__dirname}/certs/key.pem`),
    cert: fs.readFileSync(`${__dirname}/certs/cert.pem`),
  };

  const promise = createPromise();
  const server = https
    .createServer(options, (req, res) => {
      res.connection.end();
    })
    .listen(0, () => promise.resolve());

  trackClose(server);

  await promise.promise;
  const serverPort = getPort(server);

  const tlsConnection = getTlsConnection(serverPort);
  await tlsConnection.connect();

  try {
    const httpResponse = await httpGetWithSocket(
      `https://localhost:${serverPort}/any`,
      {},
      tlsConnection.socket,
    );
    expect(httpResponse).not.toBeTruthy();
  } catch (err) {
    expect(err).toBeTruthy();
  }
});

async function httpGetWithSocket(
  url: string,
  clientOptions: https.RequestOptions,
  socket: net.Socket,
) {
  return await new Promise<string>((resolve, reject) => {
    let isResolved = false;
    socket.once('close', err => {
      if (isResolved) return;
      reject(err);
    });
    socket.once('error', err => {
      if (isResolved) return;
      reject(err);
    });
    const request = https.get(
      url,
      {
        ...clientOptions,
        createConnection: () => socket,
      },
      async res => {
        isResolved = true;
        resolve(await readResponse(res));
      },
    );
    request.on('error', err => {
      if (isResolved) return;
      reject(err);
    });
  });
}

function getTlsConnection(serverPort: number, clientHello = 'Chrome79') {
  const tlsConnection = new SocketConnectDriver({
    host: 'localhost',
    port: String(serverPort),
    clientHelloId: clientHello,
    servername: 'localhost',
    rejectUnauthorized: false,
  });
  Helpers.onClose(async () => tlsConnection.close());
  return tlsConnection;
}

async function startProxy() {
  const proxyPromise = createPromise();
  const proxy = new Proxy(http.createServer());
  proxy.listen(0, () => {
    proxyPromise.resolve();
  });
  proxy.unref();

  trackClose(proxy);
  await proxyPromise.promise;
  return proxy;
}

function trackClose(closable: { close: (...args: any[]) => any }) {
  Helpers.onClose(() => new Promise(resolve => closable.close(() => resolve())));
}

async function readResponse(res: stream.Readable) {
  const buffer: Buffer[] = [];
  for await (const data of res) {
    buffer.push(data);
  }
  return Buffer.concat(buffer).toString();
}

async function startHttpsServer(onRequest: (req: http.IncomingMessage) => string) {
  const options = {
    key: fs.readFileSync(`${__dirname}/certs/key.pem`),
    cert: fs.readFileSync(`${__dirname}/certs/cert.pem`),
  };

  const promise = createPromise();
  const server = https
    .createServer(options, (req, res1) => {
      return res1.end(onRequest(req));
    })
    .listen(0, () => promise.resolve())
    .unref();

  trackClose(server);
  await promise.promise;
  return server;
}

function getPort(server: http.Server | https.Server) {
  return (server.address() as net.AddressInfo).port;
}

async function createHttpsServer(onRequest: (req: http.IncomingMessage) => string) {
  const server = await startHttpsServer(onRequest);
  return getPort(server);
}
