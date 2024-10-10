"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const http = require("http");
const http_proxy_agent_1 = require("http-proxy-agent");
const WebSocket = require("ws");
const env_1 = require("../env");
const HeadersHandler_1 = require("../handlers/HeadersHandler");
const HttpRequestHandler_1 = require("../handlers/HttpRequestHandler");
const HttpUpgradeHandler_1 = require("../handlers/HttpUpgradeHandler");
const RequestSession_1 = require("../handlers/RequestSession");
const index_1 = require("../index");
const MitmProxy_1 = require("../lib/MitmProxy");
const Utils_1 = require("../lib/Utils");
const mocks = {
    httpRequestHandler: {
        onRequest: jest.spyOn(HttpRequestHandler_1.default.prototype, 'onRequest'),
    },
    HeadersHandler: {
        determineResourceType: jest.spyOn(HeadersHandler_1.default, 'determineResourceType'),
    },
};
let certificateGenerator;
beforeAll(() => {
    certificateGenerator = index_1.MitmProxy.createCertificateGenerator();
    unblocked_agent_testing_1.Helpers.onClose(() => certificateGenerator.close(), true);
    mocks.HeadersHandler.determineResourceType.mockImplementation(async () => {
        return {
            resourceType: 'Document',
        };
    });
});
let sessionCounter = 1;
beforeEach(() => {
    mocks.httpRequestHandler.onRequest.mockClear();
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
describe('basic MitM tests', () => {
    it('should send request through proxy', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(0);
        const res = await unblocked_agent_testing_1.Helpers.httpGet(httpServer.url, proxyHost, session.getProxyCredentials());
        expect(res.includes('Hello')).toBeTruthy();
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(1);
        await mitmServer.close();
    });
    it('should return http1 response headers through proxy', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer({
            addToResponse(response) {
                response.setHeader('x-test', ['1', '2']);
            },
        });
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(0);
        let rawHeaders = null;
        const res = await unblocked_agent_testing_1.Helpers.httpRequest(httpServer.url, 'GET', proxyHost, session.getProxyCredentials(), {}, getRes => {
            rawHeaders = getRes.rawHeaders;
        });
        const headers = (0, Utils_1.parseRawHeaders)(rawHeaders);
        expect(res.includes('Hello')).toBeTruthy();
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(1);
        expect(headers['x-test']).toHaveLength(2);
        await mitmServer.close();
    });
    it('should be able to man-in-the-middle an https request', async () => {
        const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res1) => {
            return res1.end('Secure as anything!');
        });
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(0);
        env_1.default.allowInsecure = true;
        const res = await unblocked_agent_testing_1.Helpers.httpGet(server.baseUrl, proxyHost, session.getProxyCredentials());
        expect(res.includes('Secure as anything!')).toBeTruthy();
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(1);
        env_1.default.allowInsecure = false;
    });
    it('should send an https request through upstream proxy', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const upstreamProxyHost = httpServer.url.replace(/\/$/, '');
        let upstreamProxyConnected = false;
        httpServer.on('connect', (req, socket) => {
            upstreamProxyConnected = true;
            socket.end();
        });
        const session = createSession(mitmServer, upstreamProxyHost);
        await unblocked_agent_testing_1.Helpers.httpGet('https://ulixee.org', proxyHost, session.getProxyCredentials()).catch();
        expect(upstreamProxyConnected).toBeTruthy();
    });
    it('should support http calls through the mitm', async () => {
        let headers;
        const server = http
            .createServer((req, res) => {
            headers = req.headers;
            return res.end('Ok');
        })
            .listen(0)
            .unref();
        unblocked_agent_testing_1.Helpers.onClose(() => new Promise(resolve => {
            server.close(() => resolve());
        }));
        const serverPort = server.address().port;
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(0);
        const res = await unblocked_agent_testing_1.Helpers.httpGet(`http://localhost:${serverPort}`, proxyHost, session.getProxyCredentials());
        expect(res).toBe('Ok');
        expect(headers['proxy-authorization']).not.toBeTruthy();
        expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(1);
    });
    it('should strip proxy headers', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer({
            onRequest(url, method, headers1) {
                expect(url).toBe('/page1');
                expect(method).toBe('GET');
                expect(Object.keys(headers1).filter(x => x.startsWith('proxy-'))).toHaveLength(0);
                expect(headers1.last).toBe('1');
            },
        });
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        await unblocked_agent_testing_1.Helpers.httpGet(`${httpServer.url}page1`, proxyHost, session.getProxyCredentials(), {
            'proxy-authorization': `Basic ${Buffer.from(session.getProxyCredentials()).toString('base64')}`,
            last: '1',
        }).catch();
        await httpServer.close();
        await mitmServer.close();
    });
    it('should copy post data', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        const requestFn = jest.fn();
        session.on('request', requestFn);
        const resourcePromise = new Promise(resolve => session.on('response', resolve));
        await unblocked_agent_testing_1.Helpers.httpRequest(`${httpServer.url}page2`, 'POST', proxyHost, session.getProxyCredentials(), {
            'content-type': 'application/json',
        }, null, Buffer.from(JSON.stringify({ gotData: true, isCompressed: 'no' })));
        expect(requestFn).toHaveBeenCalledTimes(1);
        const resource = await resourcePromise;
        expect(resource.postData).toBeTruthy();
        expect(resource.postData.toString()).toBe(JSON.stringify({ gotData: true, isCompressed: 'no' }));
        await httpServer.close();
        await mitmServer.close();
    });
    it('should support large post data', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer);
        const requestFn = jest.fn();
        session.on('request', requestFn);
        const proxyCredentials = session.getProxyCredentials();
        const buffers = [];
        const copyBuffer = Buffer.from('ASDGASDFASDWERWER@#$%#$%#$%#$%#DSFSFGDBSDFGD$%^$%^$%');
        for (let i = 0; i <= 10e4; i += 1) {
            buffers.push(copyBuffer);
        }
        const largeBuffer = Buffer.concat(buffers);
        const resourcePromise = new Promise(resolve => session.on('response', resolve));
        await unblocked_agent_testing_1.Helpers.httpRequest(`${httpServer.url}page2`, 'POST', proxyHost, proxyCredentials, {
            'content-type': 'application/json',
        }, null, Buffer.from(JSON.stringify({ largeBuffer: largeBuffer.toString('hex') })));
        const resource = await resourcePromise;
        expect(requestFn).toHaveBeenCalledTimes(1);
        expect(resource.postData.toString()).toBe(JSON.stringify({ largeBuffer: largeBuffer.toString('hex') }));
        await httpServer.close();
        await mitmServer.close();
    });
    it('should modify websocket upgrade headers', async () => {
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        const upgradeSpy = jest.spyOn(HttpUpgradeHandler_1.default.prototype, 'onUpgrade');
        const requestSpy = jest.spyOn(HttpRequestHandler_1.default.prototype, 'onRequest');
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const serverMessages = [];
        const serverMessagePromise = (0, utils_1.createPromise)();
        const wsServer = new WebSocket.Server({ noServer: true });
        const session = createSession(mitmServer);
        httpServer.server.on('upgrade', (request, socket, head) => {
            // ensure header is stripped
            expect(request.headers).toBeTruthy();
            for (const key of Object.keys(session.getProxyCredentials())) {
                expect(request.headers).not.toHaveProperty(key);
            }
            wsServer.handleUpgrade(request, socket, head, async (ws) => {
                ws.on('message', msg => {
                    expect(msg.toString()).toMatch(/Hi\d+/);
                    serverMessages.push(msg);
                    if (serverMessages.length === 20)
                        serverMessagePromise.resolve();
                });
                for (let i = 0; i < 20; i += 1) {
                    ws.send(`Message${i}`);
                    await new Promise(setImmediate);
                }
            });
        });
        const proxyUrl = `http://${session.getProxyCredentials()}@localhost:${mitmServer.port}`;
        const wsClient = new WebSocket(`ws://localhost:${httpServer.port}`, {
            agent: new http_proxy_agent_1.HttpProxyAgent(proxyUrl),
        });
        unblocked_agent_testing_1.Helpers.onClose(async () => wsClient.close());
        const messagePromise = (0, utils_1.createPromise)();
        const msgs = [];
        wsClient.on('open', async () => {
            wsClient.on('message', msg => {
                expect(msg.toString()).toMatch(/Message\d+/);
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
        const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
        const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
        unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
        const proxyHost = `http://localhost:${mitmServer.port}`;
        const session = createSession(mitmServer, null, {
            determineResourceType(resource) {
                resource.resourceType = 'Document';
            },
            resolveBrowserRequest() { },
            cancelPending() { },
            onInitialize() { },
        });
        const beforeHttpHook = jest.fn();
        session.hook({ beforeHttpRequest: beforeHttpHook });
        const onresponse = jest.fn();
        const onError = jest.fn();
        session.on('response', onresponse);
        session.on('http-error', onError);
        const proxyCredentials = session.getProxyCredentials();
        await unblocked_agent_testing_1.Helpers.httpGet(`${httpServer.url}page1`, proxyHost, proxyCredentials);
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
        mocks.HeadersHandler.determineResourceType.mockImplementation(async () => ({}));
        await httpServer.close();
        await mitmServer.close();
    });
});
function createSession(mitmProxy, upstreamProxyUrl = null, browserMatcher) {
    sessionCounter += 1;
    unblocked_agent_testing_1.TestLogger.testNumber = sessionCounter;
    const session = new RequestSession_1.default(`${sessionCounter}`, {}, unblocked_agent_testing_1.TestLogger.forTest(module), upstreamProxyUrl);
    session.browserRequestMatcher = browserMatcher;
    mitmProxy.registerSession(session, false);
    unblocked_agent_testing_1.Helpers.needsClosing.push(session);
    return session;
}
//# sourceMappingURL=basic.test.js.map