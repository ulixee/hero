import { Helpers } from '@secret-agent/testing';
import * as http2 from 'http2';
import { URL } from 'url';
import MitmSocket from '@secret-agent/mitm-socket';
import MitmServer from '../lib/MitmProxy';
import RequestSession from '../handlers/RequestSession';
import HttpRequestHandler from '../handlers/HttpRequestHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import MitmRequestContext from '../lib/MitmRequestContext';

const mocks = {
  httpRequestHandler: {
    onRequest: jest.spyOn<any, any>(HttpRequestHandler.prototype, 'onRequest'),
  },
  MitmRequestContext: {
    create: jest.spyOn(MitmRequestContext, 'create'),
  },
  HeadersHandler: {
    waitForResource: jest.spyOn(HeadersHandler, 'waitForResource'),
  },
};

beforeAll(() => {
  mocks.HeadersHandler.waitForResource.mockImplementation(async () => {
    return {
      resourceType: 'Document',
    } as any;
  });
});

process.env.MITM_ALLOW_INSECURE = 'true';
beforeEach(() => {
  mocks.httpRequestHandler.onRequest.mockClear();
  mocks.MitmRequestContext.create.mockClear();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should be able to handle an http->http2 request', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    return res1.end('h2 secure as anything!');
  });

  const mitmServer = await MitmServer.start();
  Helpers.onClose(() => mitmServer.close());
  const proxyHost = `http://localhost:${mitmServer.port}`;

  const session = new RequestSession('h2', 'any agent', null);

  const proxyCredentials = session.getProxyCredentials();
  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

  const res = await Helpers.httpGet(server.baseUrl, proxyHost, proxyCredentials);
  expect(res.includes('h2 secure as anything!')).toBeTruthy();
  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
  await session.close();
});

test('should be able to handle an http2->http2 request', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    return res1.end('h2 secure as anything!');
  });

  const session = new RequestSession('h2-to-h2', 'any agent', null);
  Helpers.needsClosing.push(session);
  const proxyCredentials = session.getProxyCredentials();

  const client = await createH2Connection(session.sessionId, server.baseUrl, proxyCredentials);

  const h2stream = client.request({
    ':path': '/',
  });
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('h2 secure as anything!');

  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
  const call = mocks.MitmRequestContext.create.mock.calls[0];
  expect(call[0].isUpgrade).toBe(false);
  expect(call[0].clientToProxyRequest).toBeInstanceOf(http2.Http2ServerRequest);
});

test('should support push streams', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    res1.createPushResponse(
      {
        ':path': '/push1',
      },
      (err, pushRes) => {
        pushRes.end('Push1');
      },
    );
    res1.createPushResponse(
      {
        ':path': '/push2',
      },
      (err, pushRes) => {
        pushRes.end('Push2');
      },
    );
    res1.end('H2 response');
  });

  const session = new RequestSession('h2', 'any agent', null);
  Helpers.needsClosing.push(session);
  const proxyCredentials = session.getProxyCredentials();

  const client = await createH2Connection(session.sessionId, server.baseUrl, proxyCredentials);
  const pushes: string[] = [];
  client.on('stream', (stream, headers1) => {
    pushes.push(headers1[':path']);
  });
  const h2stream = client.request({ ':path': '/' });
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('H2 response');
  expect(pushes.includes('/push1')).toBeTruthy();
  expect(pushes.includes('/push2')).toBeTruthy();
});

test('should handle h2 client going to h1 request', async () => {
  const server = await Helpers.runHttpsServer((req, res) => {
    if (req.url === '/provided') {
      expect(req.headers.test).toEqual('Im here');
      expect(req.headers[':path']).not.toBeTruthy();
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Keep-Alive': 'timeout=5',
        'Cache-Control': 'public',
      });
      res.end('Gtg');
    }
  });

  const session = new RequestSession('h2-to-h1', 'any agent', null);
  Helpers.needsClosing.push(session);
  const proxyCredentials = session.getProxyCredentials();
  const client = await createH2Connection(session.sessionId, server.baseUrl, proxyCredentials);

  client.on('error', err => {
    expect(err).not.toBeTruthy();
  });

  const h2stream = client.request({
    ':path': '/provided',
    ':method': 'GET',
    test: 'Im here',
  });
  const responseHeaders = await new Promise<
    http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader
  >(resolve => {
    h2stream.on('response', headers1 => resolve(headers1));
  });
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('Gtg');
  expect(responseHeaders).toEqual({
    ':status': 200,
    'cache-control': 'public',
    date: expect.any(String),
  });
});

test('should send trailers', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    res1.writeHead(200, { header1: 'test' });
    res1.addTrailers({
      'mr-trailer': '1',
    });
    return res1.end('Trailin...');
  });

  const session = new RequestSession('trailers', 'any agent', null);
  Helpers.needsClosing.push(session);
  const proxyCredentials = session.getProxyCredentials();

  const client = await createH2Connection(session.sessionId, server.baseUrl, proxyCredentials);

  const h2stream = client.request({ ':path': '/' });
  const trailers = await new Promise(resolve => h2stream.once('trailers', resolve));
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('Trailin...');
  expect(trailers['mr-trailer']).toBe('1');
});

async function createH2Connection(sessionId: string, url: string, proxyCredentials: string) {
  const hostUrl = new URL(url);
  const mitmServer = await MitmServer.start();
  Helpers.onClose(() => mitmServer.close());
  const proxyHost = `http://localhost:${mitmServer.port}`;

  const tlsConnection = new MitmSocket(sessionId, {
    host: 'localhost',
    port: hostUrl.port,
    servername: 'localhost',
    clientHelloId: 'Chrome72',
    isSsl: url.startsWith('https'),
    proxyUrl: proxyHost,
    proxyAuthBase64: Buffer.from(proxyCredentials).toString('base64'),
    rejectUnauthorized: false,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect();
  return http2.connect(url, {
    createConnection: () => tlsConnection.socket,
  });
}
