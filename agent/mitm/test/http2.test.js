"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const http2 = require("http2");
const url_1 = require("url");
const unblocked_agent_mitm_socket_1 = require("@ulixee/unblocked-agent-mitm-socket");
const MitmSocketSession_1 = require("@ulixee/unblocked-agent-mitm-socket/lib/MitmSocketSession");
const MitmProxy_1 = require("../lib/MitmProxy");
const RequestSession_1 = require("../handlers/RequestSession");
const HttpRequestHandler_1 = require("../handlers/HttpRequestHandler");
const HeadersHandler_1 = require("../handlers/HeadersHandler");
const MitmRequestContext_1 = require("../lib/MitmRequestContext");
const Utils_1 = require("../lib/Utils");
const CacheHandler_1 = require("../handlers/CacheHandler");
const env_1 = require("../env");
const index_1 = require("../index");
const mocks = {
    httpRequestHandler: {
        onRequest: jest.spyOn(HttpRequestHandler_1.default.prototype, 'onRequest'),
    },
    MitmRequestContext: {
        create: jest.spyOn(MitmRequestContext_1.default, 'create'),
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
beforeEach(() => {
    env_1.default.allowInsecure = true;
    mocks.httpRequestHandler.onRequest.mockClear();
    mocks.MitmRequestContext.create.mockClear();
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
test('should be able to handle an http2->http2 request', async () => {
    // eslint-disable-next-line prefer-const
    let headers;
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res1) => {
        expect(req.rawHeaders
            .map((x, i) => {
            if (i % 2 === 0)
                return x;
            return undefined;
        })
            .filter(Boolean)).toEqual(Object.keys(headers));
        return res1.end('h2 secure as anything!');
    });
    headers = {
        ':method': 'GET',
        ':authority': `${server.baseUrl.replace('https://', '')}`,
        ':scheme': 'https',
        ':path': '/temp1',
        'sec-ch-ua': '"Chromium";v="88", "Google Chrome";v="88", ";Not A Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'upgrade-insecure-requests': 1,
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
    };
    const client = await createH2Connection('h2-to-h2', server.baseUrl);
    const h2stream = client.request(headers, { weight: 216 });
    const buffer = await unblocked_agent_testing_1.Helpers.readableToBuffer(h2stream);
    expect(buffer.toString()).toBe('h2 secure as anything!');
    expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(1);
    const call = mocks.MitmRequestContext.create.mock.calls[0];
    expect(call[0].isUpgrade).toBe(false);
    expect(call[0].clientToProxyRequest).toBeInstanceOf(http2.Http2ServerRequest);
});
test('should handle server closing connection', async () => {
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res1) => {
        res1.end('h2 closing soon!');
        res1.stream.close(2);
    });
    const client = await createH2Connection('h2-close', server.baseUrl);
    const h2stream = client.request({
        ':path': '/',
    });
    const buffer = await unblocked_agent_testing_1.Helpers.readableToBuffer(h2stream);
    expect(buffer.toString()).toBe('h2 closing soon!');
});
test('should send response header arrays through proxy', async () => {
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res1) => {
        res1.setHeader('x-test', ['1', '2']);
        res1.end('headers done');
    });
    const client = await createH2Connection('h1-to-h2-response', server.baseUrl);
    const h2stream = client.request({
        ':path': '/',
    });
    const h2Headers = new Promise(resolve => {
        h2stream.on('response', (headers, flags, rawHeaders) => {
            resolve(rawHeaders);
        });
    });
    const buffer = await unblocked_agent_testing_1.Helpers.readableToBuffer(h2stream);
    expect(buffer.toString()).toBe('headers done');
    expect(mocks.httpRequestHandler.onRequest).toHaveBeenCalledTimes(1);
    const headers = (0, Utils_1.parseRawHeaders)(await h2Headers);
    expect(headers['x-test']).toHaveLength(2);
});
test('should support push streams', async () => {
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res1) => {
        res1.createPushResponse({
            ':path': '/push1',
        }, (err, pushRes) => {
            pushRes.end('Push1');
        });
        res1.createPushResponse({
            ':path': '/push2',
            'send-1': ['a', 'b'],
        }, (err, pushRes) => {
            pushRes.setHeader('x-push-test', ['1', '2', '3']);
            pushRes.end('Push2');
        });
        res1.end('H2 response');
    });
    const client = await createH2Connection('push-streams', server.baseUrl);
    const pushRequestHeaders = {};
    client.on('stream', (stream, headers1, flags, rawHeaders) => {
        const path = headers1[':path'];
        pushRequestHeaders[path] = { requestHeaders: (0, Utils_1.parseRawHeaders)(rawHeaders) };
        stream.on('push', (responseHeaders, responseFalgs, rawResponseHeaders) => {
            pushRequestHeaders[path].responseHeaders = (0, Utils_1.parseRawHeaders)(rawResponseHeaders);
        });
    });
    const h2stream = client.request({ ':path': '/' });
    const buffer = await unblocked_agent_testing_1.Helpers.readableToBuffer(h2stream);
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
test('should handle cache headers for h2', async () => {
    const etags = [];
    CacheHandler_1.default.isEnabled = true;
    unblocked_agent_testing_1.Helpers.onClose(() => (CacheHandler_1.default.isEnabled = false));
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res) => {
        if (req.headers[':path'] === '/cached') {
            etags.push(req.headers['if-none-match']);
            res.setHeader('etag', '"46e2aa1bef425becb0cb4651c23fff38:1573670083.753497"');
            return res.end('cached');
        }
        return res.end('bad data');
    });
    const client = await createH2Connection('cached-etag', server.baseUrl);
    const res1 = await client.request({ ':path': '/cached' });
    expect(res1).toBeTruthy();
    await new Promise(resolve => res1.once('response', resolve));
    expect(etags).toHaveLength(1);
    expect(etags[0]).not.toBeTruthy();
    const res2 = await client.request({ ':path': '/cached' });
    expect(res2).toBeTruthy();
    const result = await new Promise(resolve => res2.once('response', resolve));
    expect(result[':status']).toBe(200);
    expect(etags).toHaveLength(2);
    expect(etags[1]).toBe('"46e2aa1bef425becb0cb4651c23fff38:1573670083.753497"');
    const res3 = await client.request({ ':path': '/cached', 'if-none-match': 'etag2' });
    expect(res3).toBeTruthy();
    await new Promise(resolve => res3.once('response', resolve));
    expect(etags).toHaveLength(3);
    expect(etags[2]).toBe('etag2');
});
test('should send trailers', async () => {
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res1) => {
        res1.writeHead(200, { header1: 'test' });
        res1.addTrailers({
            'mr-trailer': '1',
        });
        return res1.end('Trailin...');
    });
    const client = await createH2Connection('trailers', server.baseUrl);
    const h2stream = client.request({ ':path': '/' });
    const trailers = await new Promise(resolve => h2stream.once('trailers', resolve));
    const buffer = await unblocked_agent_testing_1.Helpers.readableToBuffer(h2stream);
    expect(buffer.toString()).toBe('Trailin...');
    expect(trailers['mr-trailer']).toBe('1');
});
async function createH2Connection(sessionIdPrefix, url) {
    const hostUrl = new url_1.URL(url);
    const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
    unblocked_agent_testing_1.Helpers.onClose(() => mitmServer.close());
    const session = createSession(mitmServer, sessionIdPrefix);
    const sessionId = session.sessionId;
    const proxyCredentials = session.getProxyCredentials();
    const proxyHost = `http://${proxyCredentials}@localhost:${mitmServer.port}`;
    const mitmSocketSession = new MitmSocketSession_1.default(session.logger, {
        clientHelloId: 'chrome-115',
        rejectUnauthorized: false,
    });
    unblocked_agent_testing_1.Helpers.needsClosing.push(mitmSocketSession);
    const tlsConnection = new unblocked_agent_mitm_socket_1.default(sessionId, session.logger, {
        host: 'localhost',
        port: hostUrl.port,
        servername: 'localhost',
        keepAlive: true,
        isSsl: url.startsWith('https'),
        proxyUrl: proxyHost,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
    await tlsConnection.connect(mitmSocketSession);
    const client = http2.connect(url, {
        createConnection: () => tlsConnection.socket,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => client.close());
    return client;
}
let sessionCounter = 0;
function createSession(mitmProxy, sessionId = '') {
    sessionCounter += 1;
    unblocked_agent_testing_1.TestLogger.testNumber = sessionCounter;
    const session = new RequestSession_1.default(`${sessionId}${sessionCounter}`, {}, unblocked_agent_testing_1.TestLogger.forTest(module));
    mitmProxy.registerSession(session, false);
    unblocked_agent_testing_1.Helpers.needsClosing.push(session);
    return session;
}
//# sourceMappingURL=http2.test.js.map