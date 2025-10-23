"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const https = require("https");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const helpers_1 = require("@ulixee/unblocked-agent-testing/helpers");
const WebSocket = require("ws");
const http_proxy_agent_1 = require("http-proxy-agent");
const MitmProxy_1 = require("../lib/MitmProxy");
const RequestSession_1 = require("../handlers/RequestSession");
const HeadersHandler_1 = require("../handlers/HeadersHandler");
const MitmRequestAgent_1 = require("../lib/MitmRequestAgent");
const index_1 = require("../index");
const mocks = {
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
    unblocked_agent_testing_1.TestLogger.testNumber += 1;
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
test('should create up to a max number of secure connections per origin', async () => {
    const remotePorts = [];
    MitmRequestAgent_1.default.defaultMaxConnectionsPerOrigin = 2;
    const server = await (0, helpers_1.runHttpsServer)((req, res) => {
        remotePorts.push(req.connection.remotePort);
        res.socket.setKeepAlive(true);
        res.end('I am here');
    });
    const mitmServer = await startMitmServer();
    const session = createMitmSession(mitmServer);
    // @ts-ignore
    const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;
    const proxyCredentials = session.getProxyCredentials();
    const promises = [];
    for (let i = 0; i < 10; i += 1) {
        // eslint-disable-next-line jest/valid-expect-in-promise
        const p = unblocked_agent_testing_1.Helpers.httpGet(server.baseUrl, `http://localhost:${mitmServer.port}`, proxyCredentials, { connection: 'keep-alive' }).then(
        // eslint-disable-next-line promise/always-return,@typescript-eslint/no-floating-promises
        res => {
            expect(res).toBe('I am here');
        });
        promises.push(p);
    }
    await Promise.all(promises);
    const host = server.baseUrl.replace('https://', '');
    // @ts-ignore
    expect(connectionsByOrigin.get(host).pooled).toBe(2);
    await session.close();
    const uniquePorts = new Set(remotePorts);
    expect(uniquePorts.size).toBe(2);
});
test('should create new connections as needed when no keepalive', async () => {
    const remotePorts = [];
    MitmRequestAgent_1.default.defaultMaxConnectionsPerOrigin = 1;
    const server = await (0, helpers_1.runHttpsServer)((req, res) => {
        remotePorts.push(req.connection.remotePort);
        res.end('here 2');
    });
    const mitmServer = await startMitmServer();
    const session = createMitmSession(mitmServer);
    // @ts-ignore
    const connectionsByOrigin = session.requestAgent.socketPoolByOrigin;
    const proxyCredentials = session.getProxyCredentials();
    const promises = [];
    for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line jest/valid-expect-in-promise
        const p = unblocked_agent_testing_1.Helpers.httpGet(server.baseUrl, `http://localhost:${mitmServer.port}`, proxyCredentials).then(
        // eslint-disable-next-line promise/always-return,@typescript-eslint/no-floating-promises
        res => {
            expect(res).toBe('here 2');
        });
        promises.push(p);
    }
    await Promise.all(promises);
    const host = server.baseUrl.replace('https://', '');
    // they all close after use, so should be gone now
    // @ts-ignore
    expect(connectionsByOrigin.get(host).pooled).toBe(0);
    await session.close();
    const uniquePorts = new Set(remotePorts);
    expect(uniquePorts.size).toBe(4);
});
test('should be able to handle a reused socket that closes on server', async () => {
    MitmRequestAgent_1.default.defaultMaxConnectionsPerOrigin = 1;
    let serverSocket;
    const sockets = new Set();
    const server = await unblocked_agent_testing_1.Helpers.runHttpsServer(async (req, res) => {
        res.writeHead(200, { Connection: 'keep-alive' });
        res.end('Looks good');
        serverSocket = res.socket;
        sockets.add(res.socket);
    });
    const mitmServer = await startMitmServer();
    const session = createMitmSession(mitmServer);
    const proxyCredentials = session.getProxyCredentials();
    {
        let headers;
        const response = await unblocked_agent_testing_1.Helpers.httpRequest(server.baseUrl, 'GET', `http://localhost:${mitmServer.port}`, proxyCredentials, {
            connection: 'keep-alive',
        }, res => {
            headers = res.headers;
        });
        expect(headers.connection).toBe('keep-alive');
        expect(response).toBe('Looks good');
    }
    // @ts-ignore
    const originalFn = session.requestAgent.http1Request.bind(session.requestAgent);
    const httpRequestSpy = jest.spyOn(session.requestAgent, 'http1Request');
    httpRequestSpy.mockImplementationOnce(async (ctx, settings) => {
        serverSocket.destroy();
        await new Promise(setImmediate);
        return await originalFn(ctx, settings);
    });
    {
        const request = https.request({
            host: 'localhost',
            port: server.port,
            method: 'GET',
            path: '/',
            headers: {
                connection: 'keep-alive',
            },
            rejectUnauthorized: false,
            agent: (0, helpers_1.getProxyAgent)(new url_1.URL(server.baseUrl), `http://localhost:${mitmServer.port}`, proxyCredentials),
        });
        const responseP = new Promise(resolve => request.on('response', resolve));
        request.end();
        const response = await responseP;
        expect(response.headers.connection).toBe('keep-alive');
        const body = [];
        for await (const chunk of response) {
            body.push(chunk.toString());
        }
        expect(body.join('')).toBe('Looks good');
    }
    expect(sockets.size).toBe(2);
    expect(httpRequestSpy).toHaveBeenCalledTimes(2);
    httpRequestSpy.mockClear();
});
test('it should not put upgrade connections in a pool', async () => {
    const httpServer = await unblocked_agent_testing_1.Helpers.runHttpServer();
    const mitmServer = await startMitmServer();
    const wsServer = new WebSocket.Server({ noServer: true });
    const session = createMitmSession(mitmServer);
    httpServer.server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, async (ws) => {
            expect(ws).toBeTruthy();
        });
    });
    const proxyUrl = `http://${session.getProxyCredentials()}@localhost:${mitmServer.port}`;
    const wsClient = new WebSocket(`ws://localhost:${httpServer.port}`, {
        agent: new http_proxy_agent_1.HttpProxyAgent(proxyUrl),
    });
    unblocked_agent_testing_1.Helpers.onClose(async () => wsClient.close());
    await new Promise(resolve => wsClient.on('open', resolve));
    // @ts-ignore
    const pool = session.requestAgent.socketPoolByOrigin.get(`localhost:${httpServer.port}`);
    // @ts-ignore
    expect(pool.pooled).toBe(0);
});
test('it should reuse http2 connections', async () => {
    MitmRequestAgent_1.default.defaultMaxConnectionsPerOrigin = 4;
    const httpServer = await unblocked_agent_testing_1.Helpers.runHttp2Server((request, response) => {
        response.end(request.url);
    });
    const baseUrl = httpServer.baseUrl;
    const mitmServer = await startMitmServer();
    const session = createMitmSession(mitmServer);
    // @ts-ignore
    const pool = session.requestAgent.socketPoolByOrigin;
    const proxyCredentials = session.getProxyCredentials();
    const proxyUrl = `http://${proxyCredentials}@localhost:${mitmServer.port}`;
    const results = await Promise.all([
        unblocked_agent_testing_1.Helpers.http2Get(baseUrl, { ':path': '/test1' }, session.sessionId, proxyUrl),
        unblocked_agent_testing_1.Helpers.http2Get(baseUrl, { ':path': '/test2' }, session.sessionId, proxyUrl),
        unblocked_agent_testing_1.Helpers.http2Get(baseUrl, { ':path': '/test3' }, session.sessionId, proxyUrl),
    ]);
    expect(results).toStrictEqual(['/test1', '/test2', '/test3']);
    const host = baseUrl.replace('https://', '');
    // not reusable, so should not be here
    // @ts-ignore
    expect(pool.get(host).pooled).toBe(0);
    // @ts-ignore
    expect(pool.get(host).http2Sessions).toHaveLength(1);
});
async function startMitmServer() {
    const mitmServer = await MitmProxy_1.default.start(certificateGenerator);
    unblocked_agent_testing_1.Helpers.onClose(() => mitmServer.close());
    return mitmServer;
}
let counter = 1;
function createMitmSession(mitmServer) {
    counter += 1;
    const session = new RequestSession_1.default(`${counter}`, {}, unblocked_agent_testing_1.TestLogger.forTest(module));
    mitmServer.registerSession(session, false);
    return session;
}
//# sourceMappingURL=MitmRequestAgent.test.js.map