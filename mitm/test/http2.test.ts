import { Helpers } from '@secret-agent/testing';
import * as http2 from 'http2';
import { URL } from 'url';
import MitmSocket from '@secret-agent/mitm-socket';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import MitmSocketSession from '@secret-agent/mitm-socket/lib/MitmSocketSession';
import MitmServer from '../lib/MitmProxy';
import RequestSession from '../handlers/RequestSession';
import HttpRequestHandler from '../handlers/HttpRequestHandler';
import HeadersHandler from '../handlers/HeadersHandler';
import MitmRequestContext from '../lib/MitmRequestContext';
import { parseRawHeaders } from '../lib/Utils';
import CacheHandler from '../handlers/CacheHandler';

const mocks = {
  httpRequestHandler: {
    onRequest: jest.spyOn<any, any>(HttpRequestHandler.prototype, 'onRequest'),
  },
  MitmRequestContext: {
    create: jest.spyOn(MitmRequestContext, 'create'),
  },
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

  const session = createSession(mitmServer, 'h2');

  const proxyCredentials = session.getProxyCredentials();
  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

  const res = await Helpers.httpGet(server.baseUrl, proxyHost, proxyCredentials);
  expect(res).toBe('h2 secure as anything!');
  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
  await session.close();
});

test('should be able to handle an http2->http2 request', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    return res1.end('h2 secure as anything!');
  });

  const client = await createH2Connection('h2-to-h2', server.baseUrl);

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

test('should handle server closing connection', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    res1.end('h2 closing soon!');
    res1.stream.close(2);
  });

  const client = await createH2Connection('h2-close', server.baseUrl);

  const h2stream = client.request({
    ':path': '/',
  });
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('h2 closing soon!');
});

it('should send http1 response headers through proxy', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    res1.setHeader('x-test', ['1', '2']);
    res1.end('headers done');
  });

  const client = await createH2Connection('h1-to-h2-response', server.baseUrl);

  const h2stream = client.request({
    ':path': '/',
  });
  const h2Headers = new Promise<string[]>(resolve => {
    h2stream.on('response', (headers, flags, rawHeaders) => {
      resolve(rawHeaders);
    });
  });
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('headers done');

  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
  const headers = parseRawHeaders(await h2Headers);
  expect(headers['x-test']).toHaveLength(2);
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
        'send-1': ['a', 'b'],
      },
      (err, pushRes) => {
        pushRes.setHeader('x-push-test', ['1', '2', '3']);
        pushRes.end('Push2');
      },
    );
    res1.end('H2 response');
  });

  const client = await createH2Connection('push-streams', server.baseUrl);
  const pushRequestHeaders: {
    [path: string]: { requestHeaders: IResourceHeaders; responseHeaders?: IResourceHeaders };
  } = {};
  client.on('stream', (stream, headers1, flags, rawHeaders) => {
    const path = headers1[':path'];
    pushRequestHeaders[path] = { requestHeaders: parseRawHeaders(rawHeaders) };
    stream.on('push', (responseHeaders, responseFalgs, rawResponseHeaders) => {
      pushRequestHeaders[path].responseHeaders = parseRawHeaders(rawResponseHeaders);
    });
  });
  const h2stream = client.request({ ':path': '/' });
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('H2 response');
  expect(pushRequestHeaders['/push1']).toBeTruthy();
  expect(pushRequestHeaders['/push2']).toBeTruthy();
  expect(pushRequestHeaders['/push2'].responseHeaders['x-push-test']).toStrictEqual([
    '1',
    '2',
    '3',
  ]);
  expect(pushRequestHeaders['/push2'].requestHeaders['send-1']).toStrictEqual(['a', 'b']);
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

  const client = await createH2Connection('h2-to-h1', server.baseUrl);

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
  expect(responseHeaders[':status']).toBe(200);
  expect(responseHeaders['cache-control']).toBe('public');
  expect(responseHeaders.date).toBeTruthy();
});

test('should handle cache headers for h2', async () => {
  const etags: string[] = [];
  CacheHandler.isEnabled = true;
  Helpers.onClose(() => (CacheHandler.isEnabled = false));
  const server = await Helpers.runHttp2Server((req, res1) => {
    if (req.headers[':path'] === '/cached') {
      etags.push(req.headers['if-none-match'] as string);
      res1.setHeader('etag', '"46e2aa1bef425becb0cb4651c23fff38:1573670083.753497"');
      return res1.end(Buffer.from(['a', 'c']));
    }
    return res1.end('bad data');
  });

  const mitmServer = await MitmServer.start();
  Helpers.onClose(() => mitmServer.close());
  const proxyHost = `http://localhost:${mitmServer.port}`;

  const session = createSession(mitmServer, 'h2-cache-headers');
  Helpers.needsClosing.push(session);

  const proxyCredentials = session.getProxyCredentials();
  expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

  const res1 = await Helpers.httpGet(`${server.baseUrl}/cached`, proxyHost, proxyCredentials);
  expect(res1).toBeTruthy();
  expect(etags[0]).not.toBeTruthy();

  const res2 = await Helpers.httpGet(`${server.baseUrl}/cached`, proxyHost, proxyCredentials);
  expect(res2).toBeTruthy();
  expect(etags[1]).toBe('"46e2aa1bef425becb0cb4651c23fff38:1573670083.753497"');

  const res3 = await Helpers.httpGet(`${server.baseUrl}/cached`, proxyHost, proxyCredentials, {
    'if-none-match': 'etag2',
  });
  expect(res3).toBeTruthy();
  expect(etags[2]).toBe('etag2');
});

test('should send trailers', async () => {
  const server = await Helpers.runHttp2Server((req, res1) => {
    res1.writeHead(200, { header1: 'test' });
    res1.addTrailers({
      'mr-trailer': '1',
    });
    return res1.end('Trailin...');
  });

  const client = await createH2Connection('trailers', server.baseUrl);

  const h2stream = client.request({ ':path': '/' });
  const trailers = await new Promise(resolve => h2stream.once('trailers', resolve));
  const buffer = await Helpers.readableToBuffer(h2stream);
  expect(buffer.toString()).toBe('Trailin...');
  expect(trailers['mr-trailer']).toBe('1');
});

async function createH2Connection(sessionId: string, url: string) {
  const hostUrl = new URL(url);
  const mitmServer = await MitmServer.start();
  Helpers.onClose(() => mitmServer.close());

  const session = createSession(mitmServer, sessionId);
  const proxyCredentials = session.getProxyCredentials();
  const proxyHost = `http://${proxyCredentials}@localhost:${mitmServer.port}`;
  const mitmSocketSession = new MitmSocketSession(sessionId, {
    clientHelloId: 'Chrome72',
    rejectUnauthorized: false,
  });
  Helpers.needsClosing.push(mitmSocketSession);

  const tlsConnection = new MitmSocket(sessionId, {
    host: 'localhost',
    port: hostUrl.port,
    servername: 'localhost',
    isSsl: url.startsWith('https'),
    proxyUrl: proxyHost,
  });
  Helpers.onClose(async () => tlsConnection.close());
  await tlsConnection.connect(mitmSocketSession);
  const client = http2.connect(url, {
    createConnection: () => tlsConnection.socket,
  });
  Helpers.onClose(async () => client.close());
  return client;
}

let sessionCounter = 0;
function createSession(mitmProxy: MitmServer, sessionId = '') {
  const session = new RequestSession(`${sessionId}${(sessionCounter += 1)}`, 'any agent', null);
  mitmProxy.registerSession(session, false);
  Helpers.needsClosing.push(session);

  return session;
}
