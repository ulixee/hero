import * as http from 'http';
import { IncomingHttpHeaders } from 'http';
import { Helpers, TestLogger } from '@unblocked-web/agent-testing';
import * as HttpProxyAgent from 'http-proxy-agent';
import * as Url from 'url';
import { AddressInfo, Socket } from 'net';
import * as WebSocket from 'ws';
import { createPromise } from '@ulixee/commons/lib/utils';
import IHttpResourceLoadDetails from '@unblocked-web/specifications/agent/net/IHttpResourceLoadDetails';
import CertificateGenerator from '@unblocked-web/agent-mitm-socket/lib/CertificateGenerator';
import HttpRequestHandler from '../handlers/HttpRequestHandler';
import RequestSession, { IRequestSessionRequestEvent } from '../handlers/RequestSession';
import MitmServer from '../lib/MitmProxy';
import HeadersHandler from '../handlers/HeadersHandler';
import HttpUpgradeHandler from '../handlers/HttpUpgradeHandler';
import { parseRawHeaders } from '../lib/Utils';
import IBrowserRequestMatcher from '../interfaces/IBrowserRequestMatcher';
import env from '../env';
import { MitmProxy } from '../index';

const mocks = {
  httpRequestHandler: {
    onRequest: jest.spyOn<any, any>(HttpRequestHandler.prototype, 'onRequest'),
  },
  HeadersHandler: {
    determineResourceType: jest.spyOn(HeadersHandler, 'determineResourceType'),
  },
};
let certificateGenerator: CertificateGenerator;

beforeAll(() => {
  certificateGenerator = MitmProxy.createCertificateGenerator();
  Helpers.onClose(() => certificateGenerator.close(), true);
  mocks.HeadersHandler.determineResourceType.mockImplementation(async () => {
    return {
      resourceType: 'Document',
    } as any;
  });
});

let sessionCounter = 1;
beforeEach(() => {
  mocks.httpRequestHandler.onRequest.mockClear();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic MitM tests', () => {
  it('should send request through proxy', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer);
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

    const res = await Helpers.httpGet(httpServer.url, proxyHost, session.getProxyCredentials());
    expect(res.includes('Hello')).toBeTruthy();
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);

    await mitmServer.close();
  });

  it('should return http1 response headers through proxy', async () => {
    const httpServer = await Helpers.runHttpServer({
      addToResponse(response) {
        response.setHeader('x-test', ['1', '2']);
      },
    });
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer);
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

    let rawHeaders: string[] = null;
    const res = await Helpers.httpRequest(
      httpServer.url,
      'GET',
      proxyHost,
      session.getProxyCredentials(),
      {},
      getRes => {
        rawHeaders = getRes.rawHeaders;
      },
    );
    const headers = parseRawHeaders(rawHeaders);
    expect(res.includes('Hello')).toBeTruthy();
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
    expect(headers['x-test']).toHaveLength(2);

    await mitmServer.close();
  });

  it('should be able to man-in-the-middle an https request', async () => {
    const server = await Helpers.runHttpsServer((req, res1) => {
      return res1.end('Secure as anything!');
    });

    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer);
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

    env.allowInsecure = true;
    const res = await Helpers.httpGet(server.baseUrl, proxyHost, session.getProxyCredentials());
    expect(res.includes('Secure as anything!')).toBeTruthy();
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
    env.allowInsecure = false;
  });

  it('should send an https request through upstream proxy', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;
    const upstreamProxyHost = httpServer.url.replace(/\/$/, '');

    let upstreamProxyConnected = false;
    httpServer.on('connect', (req: http.IncomingMessage, socket: any) => {
      upstreamProxyConnected = true;
      socket.end();
    });

    const session = createSession(mitmServer, upstreamProxyHost);

    await Helpers.httpGet(
      'https://dataliberationfoundation.org',
      proxyHost,
      session.getProxyCredentials(),
    ).catch();

    expect(upstreamProxyConnected).toBeTruthy();
  });

  it('should support http calls through the mitm', async () => {
    let headers: IncomingHttpHeaders;
    const server = http
      .createServer((req, res) => {
        headers = req.headers;
        return res.end('Ok');
      })
      .listen(0)
      .unref();
    Helpers.onClose(
      () =>
        new Promise<void>(resolve => {
          server.close(() => resolve());
        }),
    );

    const serverPort = (server.address() as AddressInfo).port;

    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer);
    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(0);

    const res = await Helpers.httpGet(
      `http://localhost:${serverPort}`,
      proxyHost,
      session.getProxyCredentials(),
    );
    expect(res).toBe('Ok');
    expect(headers['proxy-authorization']).not.toBeTruthy();

    expect(mocks.httpRequestHandler.onRequest).toBeCalledTimes(1);
  });

  it('should strip proxy headers', async () => {
    const httpServer = await Helpers.runHttpServer({
      onRequest(url, method, headers1) {
        expect(url).toBe('/page1');
        expect(method).toBe('GET');
        expect(Object.keys(headers1).filter(x => x.startsWith('proxy-'))).toHaveLength(0);
        expect(headers1.last).toBe('1');
      },
    });
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer);

    await Helpers.httpGet(`${httpServer.url}page1`, proxyHost, session.getProxyCredentials(), {
      'proxy-authorization': `Basic ${Buffer.from(session.getProxyCredentials()).toString(
        'base64',
      )}`,
      last: '1',
    }).catch();

    await httpServer.close();
    await mitmServer.close();
  });

  it('should copy post data', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;
    const session = createSession(mitmServer);

    const requestFn = jest.fn();
    session.on('request', requestFn);
    const resourcePromise = new Promise<IRequestSessionRequestEvent>(resolve =>
      session.on('response', resolve),
    );
    await Helpers.httpRequest(
      `${httpServer.url}page2`,
      'POST',
      proxyHost,
      session.getProxyCredentials(),
      {
        'content-type': 'application/json',
      },
      null,
      Buffer.from(JSON.stringify({ gotData: true, isCompressed: 'no' })),
    );

    expect(requestFn).toHaveBeenCalledTimes(1);

    const resource = await resourcePromise;
    expect(resource.postData).toBeTruthy();
    expect(resource.postData.toString()).toBe(
      JSON.stringify({ gotData: true, isCompressed: 'no' }),
    );

    await httpServer.close();
    await mitmServer.close();
  });

  it('should support large post data', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer);

    const requestFn = jest.fn();
    session.on('request', requestFn);
    const proxyCredentials = session.getProxyCredentials();
    const buffers: Buffer[] = [];
    const copyBuffer = Buffer.from('ASDGASDFASDWERWER@#$%#$%#$%#$%#DSFSFGDBSDFGD$%^$%^$%');
    for (let i = 0; i <= 10e4; i += 1) {
      buffers.push(copyBuffer);
    }

    const largeBuffer = Buffer.concat(buffers);

    const resourcePromise = new Promise<IRequestSessionRequestEvent>(resolve =>
      session.on('response', resolve),
    );
    await Helpers.httpRequest(
      `${httpServer.url}page2`,
      'POST',
      proxyHost,
      proxyCredentials,
      {
        'content-type': 'application/json',
      },
      null,
      Buffer.from(JSON.stringify({ largeBuffer: largeBuffer.toString('hex') })),
    );

    const resource = await resourcePromise;

    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(resource.postData.toString()).toBe(
      JSON.stringify({ largeBuffer: largeBuffer.toString('hex') }),
    );

    await httpServer.close();
    await mitmServer.close();
  });

  it('should modify websocket upgrade headers', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(certificateGenerator);
    const upgradeSpy = jest.spyOn(HttpUpgradeHandler.prototype, 'onUpgrade');
    const requestSpy = jest.spyOn(HttpRequestHandler.prototype, 'onRequest');
    Helpers.needsClosing.push(mitmServer);

    const serverMessages = [];
    const serverMessagePromise = createPromise();
    const wsServer = new WebSocket.Server({ noServer: true });
    const session = createSession(mitmServer);

    httpServer.server.on('upgrade', (request, socket, head) => {
      // ensure header is stripped
      expect(request.headers).toBeTruthy();
      for (const key of Object.keys(session.getProxyCredentials())) {
        expect(request.headers).not.toHaveProperty(key);
      }

      wsServer.handleUpgrade(request, socket as Socket, head, async (ws: WebSocket) => {
        ws.on('message', msg => {
          expect(msg).toMatch(/Hi\d+/);
          serverMessages.push(msg);
          if (serverMessages.length === 20) serverMessagePromise.resolve();
        });
        for (let i = 0; i < 20; i += 1) {
          ws.send(`Message${i}`);
          await new Promise(setImmediate);
        }
      });
    });

    const wsClient = new WebSocket(`ws://localhost:${httpServer.port}`, {
      agent: HttpProxyAgent({
        ...Url.parse(`http://localhost:${mitmServer.port}`),
        auth: session.getProxyCredentials(),
      }),
    });

    Helpers.onClose(async () => wsClient.close());

    const messagePromise = createPromise();
    const msgs = [];
    wsClient.on('open', async () => {
      wsClient.on('message', msg => {
        expect(msg).toMatch(/Message\d+/);
        msgs.push(msg);
        if (msgs.length === 20) {
          messagePromise.resolve();
        }
      });
      for (let i = 0; i < 20; i += 1) {
        wsClient.send(`Hi${i}`);
        await new Promise(setImmediate);
      }
    });
    await messagePromise.promise;
    await serverMessagePromise;
    expect(upgradeSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('should intercept requests', async () => {
    mocks.HeadersHandler.determineResourceType.mockRestore();
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(certificateGenerator);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = createSession(mitmServer, null, {
      determineResourceType(resource: IHttpResourceLoadDetails) {
        resource.resourceType = 'Document';
      },
      resolveBrowserRequest() {},
      cancelPending() {},
    });
    const beforeHttpHook = jest.fn();
    session.hook({ beforeHttpRequest: beforeHttpHook });
    const onresponse = jest.fn();
    const onError = jest.fn();
    session.on('response', onresponse);
    session.on('http-error', onError);

    const proxyCredentials = session.getProxyCredentials();

    await Helpers.httpGet(`${httpServer.url}page1`, proxyHost, proxyCredentials);

    expect(beforeHttpHook).toHaveBeenCalledTimes(1);
    expect(onresponse).toHaveBeenCalledTimes(1);

    const [responseEvent] = onresponse.mock.calls[0];
    const { request, response, wasCached, resourceType, body } = responseEvent;
    expect(body).toBeInstanceOf(Buffer);
    expect(body.toString()).toBeTruthy();
    expect(response).toBeTruthy();
    expect(request.url).toBe(`${httpServer.url}page1`);
    expect(resourceType).toBe('Document');
    expect(response.remoteAddress).toContain(`${httpServer.port}`);
    expect(wasCached).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    mocks.HeadersHandler.determineResourceType.mockImplementation(async () => ({} as any));

    await httpServer.close();
    await mitmServer.close();
  });
});

function createSession(
  mitmProxy: MitmServer,
  upstreamProxyUrl: string = null,
  browserMatcher?: IBrowserRequestMatcher,
) {
  sessionCounter += 1;
  TestLogger.testNumber = sessionCounter;
  const session = new RequestSession(
    `${sessionCounter}`,
    {},
    TestLogger.forTest(module),
    upstreamProxyUrl,
  );
  session.browserRequestMatcher = browserMatcher;
  mitmProxy.registerSession(session, false);
  Helpers.needsClosing.push(session);

  return session;
}
