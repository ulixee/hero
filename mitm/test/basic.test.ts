import http from 'http';
import MitmServer from '../lib/MitmProxy';
import { Helpers } from '@secret-agent/testing';
import RequestSession from '../handlers/RequestSession';
import HttpProxyAgent from 'http-proxy-agent';
import MitmRequestHandler from '../lib/MitmRequestHandler';
import { AddressInfo } from 'net';
import WebSocket from 'ws';
import { createPromise } from '@secret-agent/commons/utils';
import HeadersHandler from '../handlers/HeadersHandler';

const mocks = {
  mitmRequestHandler: {
    handleRequest: jest.spyOn<any, any>(MitmRequestHandler.prototype, 'handleRequest'),
  },
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

beforeEach(() => {
  mocks.mitmRequestHandler.handleRequest.mockClear();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic MitM tests', () => {
  it('should send request through proxy', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(9001);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('1', 'any agent', null);

    const headers = session.getTrackingHeaders();
    expect(mocks.mitmRequestHandler.handleRequest).toBeCalledTimes(0);

    const res = await Helpers.httpGet(httpServer.url, proxyHost, headers);
    expect(res.includes('Hello')).toBeTruthy();
    expect(mocks.mitmRequestHandler.handleRequest).toBeCalledTimes(1);

    await mitmServer.close();
  });

  it('should be able to man-in-the-middle an https request', async () => {
    const server = await Helpers.runHttpsServer((req, res1) => {
      return res1.end('Secure as anything!');
    });

    const mitmServer = await MitmServer.start(9001);
    Helpers.onClose(() => mitmServer.close());
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('1', 'any agent', null);

    const headers = session.getTrackingHeaders();
    expect(mocks.mitmRequestHandler.handleRequest).toBeCalledTimes(0);

    process.env.MITM_ALLOW_INSECURE = 'true';
    const res = await Helpers.httpGet(server.baseUrl, proxyHost, headers);
    expect(res.includes('Secure as anything!')).toBeTruthy();
    expect(mocks.mitmRequestHandler.handleRequest).toBeCalledTimes(1);
    process.env.MITM_ALLOW_INSECURE = 'false';
    await session.close();
  });

  it('should send an https request through upstream proxy', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(9001);
    Helpers.onClose(() => mitmServer.close());
    const proxyHost = `http://localhost:${mitmServer.port}`;
    const upstreamProxyHost = httpServer.url.replace(/\/$/, '');

    let upstreamProxyConnected = false;
    httpServer.on('connect', (req: http.IncomingMessage, socket: any) => {
      upstreamProxyConnected = true;
      socket.end();
    });

    const session = new RequestSession('1', 'any agent', Promise.resolve(upstreamProxyHost));

    const headers = session.getTrackingHeaders();

    // tslint:disable-next-line:no-empty
    await Helpers.httpGet('https://dataliberationfoundation.org', proxyHost, headers).catch();

    expect(upstreamProxyConnected).toBeTruthy();
  });

  it('should support http calls through the mitm', async () => {
    const server = http
      .createServer((req, res) => {
        return res.end('Ok');
      })
      .listen(0)
      .unref();
    Helpers.onClose(
      () =>
        new Promise(resolve => {
          server.close(() => resolve());
        }),
    );

    const serverPort = (server.address() as AddressInfo).port;

    const mitmServer = await MitmServer.start(9003);
    Helpers.onClose(() => mitmServer.close());
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('1', 'any agent', null);

    const headers = session.getTrackingHeaders();
    expect(mocks.mitmRequestHandler.handleRequest).toBeCalledTimes(0);

    const res = await Helpers.httpGet(`http://localhost:${serverPort}`, proxyHost, headers);
    expect(res).toBe('Ok');

    expect(mocks.mitmRequestHandler.handleRequest).toBeCalledTimes(1);
    await session.close();
  });

  it('should strip mitm headers', async () => {
    const httpServer = await Helpers.runHttpServer(null, null, (url, method, headers1) => {
      expect(url).toBe('/page1');
      expect(method).toBe('GET');
      expect(Object.keys(headers1).filter(x => x.startsWith('mitm-'))).toHaveLength(0);
    });
    const mitmServer = await MitmServer.start(9002);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('2', 'any agent', null);

    const headers = session.getTrackingHeaders();
    headers.last = '1';

    await Helpers.httpGet(`${httpServer.url}page1`, proxyHost, headers).catch();

    await httpServer.close();
    await mitmServer.close();
  });

  it('should strip preflight mitm headers', async () => {
    const httpServer = await Helpers.runHttpServer(null, null, (url, method, headers1) => {
      expect(url).toBe('/page1');
      expect(method).toBe('OPTIONS');
      expect(Object.keys(headers1).filter(x => x.startsWith('mitm-'))).toHaveLength(0);
      expect(headers1['access-control-request-headers']).toEqual('X-Custom-Header');
    });
    const mitmServer = await MitmServer.start(9003);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('3', 'any agent', null);

    const headers = session.getTrackingHeaders();
    headers.Origin = httpServer.url;
    headers['Access-Control-Request-Method'] = 'GET';
    headers['Access-Control-Request-Headers'] =
      'mitm-session-id-3,mitm-request-id-1,X-Custom-Header';

    await Helpers.httpRequest(`${httpServer.url}page1`, 'OPTIONS', proxyHost, headers, res => {
      // should return the actual headers back to the client
      expect(res.headers['access-control-allow-headers']).toBe(
        'mitm-session-id-3,mitm-request-id-1,X-Custom-Header',
      );
    }).catch();

    await httpServer.close();
    await mitmServer.close();
  });

  it('should copy post data', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(9004);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('3', 'any agent', null);

    const headers = session.getTrackingHeaders();

    await Helpers.httpRequest(
      `${httpServer.url}page2`,
      'POST',
      proxyHost,
      {
        ...headers,
        'content-type': 'application/json',
      },
      null,
      Buffer.from(JSON.stringify({ gotData: true, isCompressed: 'no' })),
    );

    expect(session.requests).toHaveLength(1);
    expect(session.requests[0].postData).toBeTruthy();
    expect(session.requests[0].postData.toString()).toBe(
      JSON.stringify({ gotData: true, isCompressed: 'no' }),
    );

    await httpServer.close();
    await mitmServer.close();
  });

  it('should support large post data', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(9004);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('3', 'any agent', null);

    const headers = session.getTrackingHeaders();
    const buffers: Buffer[] = [];
    const copyBuffer = Buffer.from('ASDGASDFASDWERWER@#$%#$%#$%#$%#DSFSFGDBSDFGD$%^$%^$%');
    for (let i = 0; i <= 10e4; i += 1) {
      buffers.push(copyBuffer);
    }

    const largeBuffer = Buffer.concat(buffers);

    await Helpers.httpRequest(
      `${httpServer.url}page2`,
      'POST',
      proxyHost,
      {
        ...headers,
        'content-type': 'application/json',
      },
      null,
      Buffer.from(JSON.stringify({ largeBuffer: largeBuffer.toString('hex') })),
    );

    expect(session.requests).toHaveLength(1);
    expect(session.requests[0].postData.toString()).toBe(
      JSON.stringify({ largeBuffer: largeBuffer.toString('hex') }),
    );

    await httpServer.close();
    await mitmServer.close();
  });

  it('should modify websocket upgrade headers', async () => {
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(9004);
    const upgradeSpy = jest.spyOn(MitmRequestHandler.prototype, 'handleUpgrade');
    const requestSpy = jest.spyOn(MitmRequestHandler.prototype, 'handleRequest');
    Helpers.needsClosing.push(mitmServer);

    const serverMessages = [];
    const serverMessagePromise = createPromise();
    const wsServer = new WebSocket.Server({ noServer: true });
    const session = new RequestSession('4', 'any agent', null);

    httpServer.server.on('upgrade', (request, socket, head) => {
      // ensure header is stripped
      expect(request.headers).toBeTruthy();
      for (const key of Object.keys(session.getTrackingHeaders())) {
        expect(request.headers).not.toHaveProperty(key);
      }

      wsServer.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
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
      agent: HttpProxyAgent(`http://localhost:${mitmServer.port}`),
      headers: session.getTrackingHeaders(),
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
    mocks.HeadersHandler.waitForResource.mockRestore();
    const httpServer = await Helpers.runHttpServer();
    const mitmServer = await MitmServer.start(9001);
    Helpers.needsClosing.push(mitmServer);
    const proxyHost = `http://localhost:${mitmServer.port}`;

    const session = new RequestSession('1', 'any agent', null);
    session.delegate.modifyHeadersBeforeSend = jest.fn();
    session.registerResource({
      browserRequestId: '1',
      url: `${httpServer.url}page1`,
      method: 'GET',
      resourceType: 'Document',
      hasUserGesture: true,
      isUserNavigation: true,
      documentUrl: `${httpServer.url}page1`,
    });
    const onresponse = jest.fn();
    const onError = jest.fn();
    session.on('response', onresponse);
    session.on('httpError', onError);

    const headers = session.getTrackingHeaders();

    const result = await Helpers.httpGet(`${httpServer.url}page1`, proxyHost, headers).catch();

    expect(result).toBeTruthy();

    expect(session.delegate.modifyHeadersBeforeSend).toHaveBeenCalledTimes(1);
    expect(onresponse).toHaveBeenCalledTimes(1);

    const [responseEvent] = onresponse.mock.calls[0];
    const { request, response, wasCached, resourceType, remoteAddress, body } = responseEvent;
    expect(body).toBeInstanceOf(Buffer);
    expect(body.toString()).toBeTruthy();
    expect(response).toBeTruthy();
    expect(request.url).toBe(`${httpServer.url}page1`);
    expect(resourceType).toBe('Document');
    expect(remoteAddress).toContain(httpServer.port);
    expect(wasCached).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    mocks.HeadersHandler.waitForResource.mockImplementation(async () => ({} as any));

    await httpServer.close();
    await mitmServer.close();
  });
});
