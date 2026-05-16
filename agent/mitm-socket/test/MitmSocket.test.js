"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const utils_1 = require("@ulixee/commons/lib/utils");
const http2 = require("http2");
const WebSocket = require("ws");
const helpers_1 = require("@ulixee/unblocked-agent-testing/helpers");
const https = require("https");
const index_1 = require("../index");
const MitmSocketSession_1 = require("../lib/MitmSocketSession");
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
let sessionId = 1;
let mitmSocketSession;
beforeEach(() => {
    sessionId += 1;
    unblocked_agent_testing_1.TestLogger.testNumber = sessionId;
});
beforeAll(() => {
    mitmSocketSession = new MitmSocketSession_1.default(unblocked_agent_testing_1.TestLogger.forTest(module), {
        clientHelloId: 'chrome-115',
        rejectUnauthorized: false,
    });
    unblocked_agent_testing_1.Helpers.onClose(() => mitmSocketSession.close(), true);
});
test('should be able to send a tls connection', async () => {
    const htmlString = 'Secure as anything!';
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => {
        return res.end(htmlString);
    });
    const tlsConnection = (0, helpers_1.getTlsConnection)(server.port);
    await tlsConnection.connect(mitmSocketSession);
    const httpResponse = await (0, helpers_1.httpGetWithSocket)(`${server.baseUrl}/any`, {}, tlsConnection.socket);
    expect(httpResponse).toBe(htmlString);
});
test('should handle http2 requests', async () => {
    const httpServer = await unblocked_agent_testing_1.Helpers.runHttp2Server((request, response) => {
        response.end('I am h2');
    });
    const tlsConnection = (0, helpers_1.getTlsConnection)(httpServer.port);
    await tlsConnection.connect(mitmSocketSession);
    expect(tlsConnection.alpn).toBe('h2');
    const client = http2.connect('https://ulixee.org', {
        createConnection: () => tlsConnection.socket,
    });
    closeAfterTest(client);
    const request = client.request({ ':path': '/' });
    const httpResponse = await readResponse(request);
    expect(httpResponse).toBe('I am h2');
    client.destroy();
});
test('should be able to hit google using a Chrome Emulator', async () => {
    const socketSession = new MitmSocketSession_1.default(unblocked_agent_testing_1.TestLogger.forTest(module), {
        clientHelloId: 'chrome-115',
        rejectUnauthorized: false,
    });
    unblocked_agent_testing_1.Helpers.needsClosing.push(socketSession);
    const tlsConnection = new index_1.default(String(sessionId), unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'google.com',
        port: '443',
        servername: 'google.com',
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
    await tlsConnection.connect(socketSession);
    expect(tlsConnection.alpn).toBe('h2');
    // this is an encoded application settings set
    expect(tlsConnection.rawApplicationSettings).toBeTruthy();
    expect(tlsConnection.alps.acceptCh).toBeTruthy();
    const client = http2.connect('https://www.google.com', {
        createConnection: () => tlsConnection.socket,
    });
    closeAfterTest(client);
    const request = client.request({ ':path': '/' });
    const httpResponse = await readResponse(request);
    expect(httpResponse).toBeTruthy();
    expect(httpResponse).toMatch(/<\/body><\/html>$/i);
});
test('should be able to hit gstatic using a Chrome Emulator', async () => {
    const tlsConnection = new index_1.default(String(sessionId), unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'www.gstatic.com',
        port: '443',
        servername: 'www.gstatic.com',
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
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
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer(async (req, res) => {
        res.socket.end(`HTTP/1.1 301 Moved Permanently\r\nContent-Length: 0\r\nConnection: close\r\nLocation: https://www.location2.com\r\n\r\n`);
    });
    const tlsConnection = new index_1.default(String(sessionId), unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: `localhost`,
        port: String(server.port),
        servername: 'localhost',
        keepAlive: true,
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
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
    const responsePromise = new Promise(resolve => request.on('response', resolve));
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
    const socketSession = new MitmSocketSession_1.default(unblocked_agent_testing_1.TestLogger.forTest(module), {
        clientHelloId: 'chrome-115',
        rejectUnauthorized: false,
    });
    unblocked_agent_testing_1.Helpers.needsClosing.push(socketSession);
    const tlsConnection = new index_1.default(String(sessionId), unblocked_agent_testing_1.TestLogger.forTest(module), {
        host: 'unpkg.com',
        port: '443',
        servername: 'unpkg.com',
        isSsl: true,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => tlsConnection.close());
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
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => res.end(htmlString));
    const messageCount = 500;
    const wsServer = new WebSocket.Server({ server: server.server });
    wsServer.on('connection', async (ws) => {
        for (let i = 0; i < messageCount; i += 1) {
            await new Promise(resolve => ws.send(i, () => {
                setTimeout(resolve, 2);
            }));
        }
    });
    const tlsConnection = (0, helpers_1.getTlsConnection)(server.port, undefined, true);
    tlsConnection.connectOpts.keepAlive = true;
    await tlsConnection.connect(mitmSocketSession);
    const wsClient = new WebSocket(`wss://localhost:${server.port}`, {
        rejectUnauthorized: false,
        createConnection: () => tlsConnection.socket,
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => wsClient.close());
    const messages = [];
    const messagePromise = (0, utils_1.createPromise)();
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
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer((req, res) => {
        res.connection.end();
    });
    const tlsConnection = (0, helpers_1.getTlsConnection)(server.port);
    await tlsConnection.connect(mitmSocketSession);
    await expect((0, helpers_1.httpGetWithSocket)(`${server.baseUrl}/any`, {}, tlsConnection.socket)).rejects.toThrow();
});
function closeAfterTest(session) {
    unblocked_agent_testing_1.Helpers.onClose(() => {
        session.destroy();
    });
}
async function readResponse(res) {
    return (await unblocked_agent_testing_1.Helpers.readableToBuffer(res)).toString();
}
//# sourceMappingURL=MitmSocket.test.js.map