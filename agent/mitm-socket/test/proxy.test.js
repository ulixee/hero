"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const helpers_1 = require("@ulixee/unblocked-agent-testing/helpers");
const http = require("http");
const http2 = require("http2");
const proxy_1 = require("proxy");
const socks5 = require("simple-socks");
const WebSocket = require("ws");
const index_1 = require("../index");
const MitmSocketSession_1 = require("../lib/MitmSocketSession");
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
let sessionId = 0;
beforeEach(() => {
    sessionId += 1;
    unblocked_agent_testing_1.TestLogger.testNumber = sessionId;
});
let mitmSocketSession;
beforeAll(() => {
    mitmSocketSession = new MitmSocketSession_1.default(unblocked_agent_testing_1.TestLogger.forTest(module), {
        clientHelloId: 'chrome-115',
        rejectUnauthorized: false,
        userAgent: 'Chrome',
    });
    unblocked_agent_testing_1.Helpers.onClose(() => mitmSocketSession.close(), true);
});
test('should be able to send a request through a proxy', async () => {
    const htmlString = 'Proxy proxy echo echo';
    const proxy = await startProxy();
    const proxyPort = proxy.address().port;
    const connect = jest.fn();
    proxy.once('connect', connect);
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const tlsConnection = new index_1.default(`${sessionId}`, unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'localhost',
        port: String(server.port),
        servername: 'localhost',
        proxyUrl: `http://localhost:${proxyPort}`,
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
    await tlsConnection.connect(mitmSocketSession);
    const httpResponse = await (0, helpers_1.httpGetWithSocket)(`${server.baseUrl}/any`, {}, tlsConnection.socket);
    expect(httpResponse).toBe(htmlString);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect.mock.calls[0][0].url).toBe(`localhost:${server.port}`);
    expect(connect.mock.calls[0][0].headers['user-agent']).toBe('Chrome');
});
test('should be able to send a request through a secure proxy with auth', async () => {
    const htmlString = 'Proxy secure proxy echo echo';
    const password = `u:password`;
    const pass64 = Buffer.from(password).toString('base64');
    const proxyServer = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const proxy = (0, proxy_1.createProxy)(proxyServer.server);
    proxy.authenticate = (req) => {
        const auth = req.headers['proxy-authorization'];
        return auth === `Basic ${pass64}`;
    };
    const connect = jest.fn();
    proxy.once('connect', connect);
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const tlsConnection = (0, helpers_1.getTlsConnection)(server.port);
    tlsConnection.setProxyUrl(`https://${password}@localhost:${proxyServer.port}`);
    await tlsConnection.connect(mitmSocketSession);
    const httpResponse = await (0, helpers_1.httpGetWithSocket)(`${server.baseUrl}/any`, {}, tlsConnection.socket);
    expect(httpResponse).toBe(htmlString);
    expect(connect).toHaveBeenCalledTimes(1);
});
test('should be able to send a request through a secure proxy with auth using special chars', async () => {
    const htmlString = 'Proxy secure proxy echo echo';
    const password = `u:abcDEF!123-_`;
    const pass64 = Buffer.from(password).toString('base64');
    const proxyServer = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const proxy = (0, proxy_1.createProxy)(proxyServer.server);
    proxy.authenticate = (req) => {
        const auth = req.headers['proxy-authorization'];
        return auth === `Basic ${pass64}`;
    };
    const connect = jest.fn();
    proxy.once('connect', connect);
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const tlsConnection = (0, helpers_1.getTlsConnection)(server.port);
    tlsConnection.setProxyUrl(`https://${password}@localhost:${proxyServer.port}`);
    await tlsConnection.connect(mitmSocketSession);
    const httpResponse = await (0, helpers_1.httpGetWithSocket)(`${server.baseUrl}/any`, {}, tlsConnection.socket);
    expect(httpResponse).toBe(htmlString);
    expect(connect).toHaveBeenCalledTimes(1);
});
test('should be able to use a socks5 proxy', async () => {
    const proxy = socks5.createServer();
    await new Promise(resolve => proxy.listen(0, resolve));
    unblocked_agent_testing_1.Helpers.needsClosing.push(proxy);
    const proxyPort = proxy.address().port;
    const htmlString = 'Proxy proxy echo echo';
    const connect = jest.fn();
    proxy.once('proxyConnect', connect);
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const tlsConnection = new index_1.default(`${sessionId}`, unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'localhost',
        port: String(server.port),
        servername: 'localhost',
        proxyUrl: `socks5://localhost:${proxyPort}`,
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
    await tlsConnection.connect(mitmSocketSession);
    const httpResponse = await (0, helpers_1.httpGetWithSocket)(`${server.baseUrl}/any`, {}, tlsConnection.socket);
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
    unblocked_agent_testing_1.Helpers.needsClosing.push(proxy);
    const proxyPort = proxy.address().port;
    const connect = jest.fn();
    const auth = jest.fn();
    proxy.once('proxyConnect', connect);
    proxy.once('authenticate', auth);
    const htmlString = 'Proxy proxy echo auth';
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res) => res.end(htmlString));
    const tlsConnection = new index_1.default(`${sessionId}`, unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'localhost',
        port: String(server.port),
        servername: 'localhost',
        proxyUrl: `socks5://foo:bar@localhost:${proxyPort}`,
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
    await tlsConnection.connect(mitmSocketSession);
    const client = http2.connect(server.baseUrl, {
        createConnection: () => tlsConnection.socket,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => client.close());
    const h2stream = client.request({ ':path': '/' });
    const httpResponse = await (0, helpers_1.readableToBuffer)(h2stream);
    expect(httpResponse.toString()).toBe(htmlString);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(auth).toHaveBeenCalledTimes(1);
});
test('should be able to use a socks5 proxy with auth, using special characters', async () => {
    const proxy = socks5.createServer({
        authenticate(username, password, socket, callback) {
            // verify username/password
            if (username !== 'abcDEF!123-_' || password !== 'GHI_jkl-456!!') {
                // respond with auth failure (can be any error)
                return setImmediate(callback, new Error('invalid credentials'));
            }
            // return successful authentication
            return setImmediate(callback);
        },
    });
    await new Promise(resolve => proxy.listen(0, resolve));
    unblocked_agent_testing_1.Helpers.needsClosing.push(proxy);
    const proxyPort = proxy.address().port;
    const connect = jest.fn();
    const auth = jest.fn();
    proxy.once('proxyConnect', connect);
    proxy.once('authenticate', auth);
    const htmlString = 'Proxy proxy echo auth';
    const server = await unblocked_agent_testing_1.Helpers.runHttp2Server((req, res) => res.end(htmlString));
    const tlsConnection = new index_1.default(`${sessionId}`, unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'localhost',
        port: String(server.port),
        servername: 'localhost',
        proxyUrl: `socks5://abcDEF!123-_:GHI_jkl-456!!@localhost:${proxyPort}`,
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
    await tlsConnection.connect(mitmSocketSession);
    const client = http2.connect(server.baseUrl, {
        createConnection: () => tlsConnection.socket,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => client.close());
    const h2stream = client.request({ ':path': '/' });
    const httpResponse = await (0, helpers_1.readableToBuffer)(h2stream);
    expect(httpResponse.toString()).toBe(htmlString);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(auth).toHaveBeenCalledTimes(1);
});
test('should handle websockets over proxies', async () => {
    const proxy = await startProxy();
    const proxyPort = proxy.address().port;
    const connect = jest.fn();
    proxy.once('connect', connect);
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(''));
    const serverPort = server.port;
    const wsServer = new WebSocket.Server({ server: server.server });
    wsServer.on('connection', async (ws) => {
        ws.send('ola');
    });
    const tlsConnection = (0, helpers_1.getTlsConnection)(serverPort, undefined, true);
    tlsConnection.connectOpts.keepAlive = true;
    tlsConnection.setProxyUrl(`http://localhost:${proxyPort}`);
    await tlsConnection.connect(mitmSocketSession);
    const wsClient = new WebSocket(`wss://localhost:${serverPort}`, {
        rejectUnauthorized: false,
        createConnection: () => tlsConnection.socket,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => wsClient.close());
    await new Promise(resolve => {
        wsClient.once('message', msg => {
            expect(msg.toString()).toBe('ola');
            resolve();
        });
    });
    expect(connect).toHaveBeenCalledTimes(1);
});
async function startProxy() {
    const proxyPromise = (0, utils_1.createPromise)();
    const proxy = (0, proxy_1.createProxy)(http.createServer());
    proxy.listen(0, () => {
        proxyPromise.resolve();
    });
    proxy.unref();
    closeAfterTest(proxy);
    await proxyPromise.promise;
    return proxy;
}
function closeAfterTest(closable) {
    unblocked_agent_testing_1.Helpers.onClose(() => new Promise(resolve => closable.close(() => process.nextTick(resolve))));
}
//# sourceMappingURL=proxy.test.js.map