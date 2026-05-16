"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsClosing = void 0;
exports.runKoaServer = runKoaServer;
exports.sslCerts = sslCerts;
exports.runHttpsServer = runHttpsServer;
exports.runHttpServer = runHttpServer;
exports.httpRequest = httpRequest;
exports.getProxyAgent = getProxyAgent;
exports.httpGet = httpGet;
exports.http2Get = http2Get;
exports.runHttp2Server = runHttp2Server;
exports.httpGetWithSocket = httpGetWithSocket;
exports.getTlsConnection = getTlsConnection;
exports.getLogo = getLogo;
exports.readableToBuffer = readableToBuffer;
exports.beforeEach = beforeEach;
exports.afterEach = afterEach;
exports.afterAll = afterAll;
exports.onClose = onClose;
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const utils_1 = require("@ulixee/commons/lib/utils");
const unblocked_agent_mitm_socket_1 = require("@ulixee/unblocked-agent-mitm-socket");
const MitmSocketSession_1 = require("@ulixee/unblocked-agent-mitm-socket/lib/MitmSocketSession");
const env_1 = require("@ulixee/unblocked-agent-mitm/env"); // eslint-disable-line import/no-extraneous-dependencies
const Fs = require("fs");
const http = require("http");
const http_proxy_agent_1 = require("http-proxy-agent");
const http2 = require("http2");
const https = require("https");
const https_proxy_agent_1 = require("https-proxy-agent");
const Path = require("path");
const querystring = require("querystring");
const Url = require("url");
const url_1 = require("url");
const KoaMulter = require("@koa/multer");
const KoaRouter = require("@koa/router");
const Koa = require("koa");
const index_1 = require("./index");
const { log } = (0, Logger_1.default)(module);
exports.needsClosing = [];
async function runKoaServer(onlyCloseOnFinal = true) {
    const koa = new Koa();
    const router = new KoaRouter();
    const exampleOrgPath = Path.join(__dirname, 'html', 'example.org.html');
    const exampleOrgHtml = Fs.readFileSync(exampleOrgPath, 'utf-8');
    const upload = KoaMulter(); // note you can pass `multer` options here
    koa.use(router.routes()).use(router.allowedMethods());
    koa.on('error', error => log.warn('Koa error', { error }));
    const server = await new Promise(resolve => {
        const koaServer = koa
            .listen(() => {
            resolve(koaServer);
        })
            .unref();
    });
    const destroyer = destroyServerFn(server);
    const port = server.address().port;
    router.baseHost = `localhost:${port}`;
    router.baseUrl = `http://${router.baseHost}`;
    router.get('/', ctx => {
        ctx.body = exampleOrgHtml;
    });
    router.close = () => {
        if (router.isClosing) {
            return;
        }
        router.isClosing = true;
        return destroyer();
    };
    router.onlyCloseOnFinal = onlyCloseOnFinal;
    exports.needsClosing.push(router);
    router.koa = koa;
    router.server = server;
    router.upload = upload;
    return router;
}
function sslCerts() {
    return {
        key: Fs.readFileSync(`${__dirname}/certs/key.pem`),
        cert: Fs.readFileSync(`${__dirname}/certs/cert.pem`),
    };
}
async function runHttpsServer(handler, onlyCloseOnFinal = false) {
    const options = {
        ...sslCerts(),
    };
    const server = https.createServer(options, handler).listen(0).unref();
    await new Promise(resolve => server.once('listening', resolve));
    const destroyServer = destroyServerFn(server);
    bindSslListeners(server);
    const port = server.address().port;
    const baseUrl = `https://localhost:${port}`;
    const httpServer = {
        isClosing: false,
        on(eventName, fn) {
            server.on(eventName, fn);
        },
        close() {
            if (httpServer.isClosing) {
                return null;
            }
            httpServer.isClosing = true;
            return destroyServer();
        },
        onlyCloseOnFinal,
        baseUrl,
        url: `${baseUrl}/`,
        port,
        server,
    };
    exports.needsClosing.push(httpServer);
    return httpServer;
}
async function runHttpServer(params = {}) {
    const { onRequest, onPost, addToResponse, handler } = params;
    const server = http.createServer().unref();
    const destroyServer = destroyServerFn(server);
    server.on('request', async (request, response) => {
        if (handler)
            return handler(request, response);
        if (onRequest)
            onRequest(request.url, request.method, request.headers);
        if (addToResponse)
            addToResponse(response);
        let pageBody = 'Hello';
        const requestUrl = Url.parse(request.url);
        if (requestUrl.pathname === '/') {
            return response.end(`<html><head></head><body>Hello world</body></html>`);
        }
        if (requestUrl.pathname === '/page1') {
            if (request.method === 'OPTIONS') {
                response.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'X-Custom-Header',
                });
                return response.end('');
            }
            return response.end(`<html><head></head><body>
<form action="/page2" method="post"><input type="text" id="input" name="thisText"/><input type="submit" id="submit-button" name="submit"/></form>
</body></html>`);
        }
        if (requestUrl.pathname === '/page2' && request.method === 'POST') {
            let body = '';
            for await (const chunk of request) {
                body += chunk;
            }
            // eslint-disable-next-line no-shadow,@typescript-eslint/no-shadow
            const params = querystring.parse(body);
            pageBody = params.thisText;
            if (onPost)
                onPost(params.thisText);
        }
        response.end(`<html><head></head><body>${pageBody}</body></html>`);
    });
    server.listen();
    await new Promise(resolve => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    const httpServer = {
        isClosing: false,
        onlyCloseOnFinal: params.onlyCloseOnFinal ?? false,
        on(eventName, fn) {
            server.on(eventName, fn);
        },
        close() {
            if (httpServer.isClosing) {
                return null;
            }
            httpServer.isClosing = true;
            return destroyServer();
        },
        baseUrl,
        url: `${baseUrl}/`,
        port,
        server,
    };
    exports.needsClosing.push(httpServer);
    return httpServer;
}
function httpRequest(urlStr, method, proxyHost, proxyAuth, headers = {}, response, postData) {
    const createdPromise = (0, utils_1.createPromise)();
    const { promise, resolve, reject } = createdPromise;
    const url = new url_1.URL(urlStr);
    const urlPort = extractPort(url);
    const urlPath = [url.pathname, url.search].join('');
    const options = {
        host: url.hostname,
        port: urlPort,
        method,
        path: urlPath,
        headers: headers || {},
        rejectUnauthorized: false,
    };
    if (proxyHost) {
        options.agent = getProxyAgent(url, proxyHost, proxyAuth);
    }
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
        if (createdPromise.isResolved)
            return;
        let data = '';
        if (response)
            response(res);
        res.on('end', () => resolve(data));
        res.on('data', chunk => (data += chunk));
    });
    req.on('error', reject);
    if (postData)
        req.write(postData);
    req.end();
    return promise;
}
function getProxyAgent(url, proxyHost, auth) {
    const proxyUrl = new url_1.URL(proxyHost);
    if (auth) {
        proxyUrl.username = auth.split(':')[0];
        proxyUrl.password = auth.split(':')[1];
    }
    return url.protocol === 'https:' ? new https_proxy_agent_1.HttpsProxyAgent(proxyUrl) : new http_proxy_agent_1.HttpProxyAgent(proxyUrl);
}
function httpGet(urlStr, proxyHost, proxyAuth, headers = {}) {
    return httpRequest(urlStr, 'GET', proxyHost, proxyAuth, headers);
}
async function http2Get(host, headers, sessionId, proxyUrl) {
    const hostUrl = new url_1.URL(host);
    const socketSession = new MitmSocketSession_1.default(index_1.TestLogger.forTest(module.parent), {
        clientHelloId: 'Chrome79',
        rejectUnauthorized: false,
    });
    index_1.Helpers.needsClosing.push(socketSession);
    const tlsConnection = getTlsConnection(Number(hostUrl.port ?? 443), hostUrl.hostname, false, proxyUrl);
    index_1.Helpers.onClose(() => tlsConnection.close());
    await tlsConnection.connect(socketSession);
    const client = http2.connect(host, {
        createConnection: () => tlsConnection.socket,
    });
    index_1.Helpers.onClose(() => client.close());
    const responseStream = await client.request(headers);
    await new Promise(resolve => responseStream.once('response', resolve));
    return (await readableToBuffer(responseStream)).toString();
}
async function runHttp2Server(handler) {
    const h2ServerStarted = (0, utils_1.createPromise)();
    const sessions = new Set();
    const server = http2
        .createSecureServer(sslCerts(), handler)
        .unref()
        .listen(0, () => {
        h2ServerStarted.resolve();
    });
    bindSslListeners(server);
    server.on('session', session => {
        sessions.add(session);
    });
    await h2ServerStarted.promise;
    const port = server.address().port;
    const baseUrl = `https://localhost:${port}`;
    const httpServer = {
        isClosing: false,
        onlyCloseOnFinal: false,
        on(eventName, fn) {
            server.on(eventName, fn);
        },
        close() {
            if (httpServer.isClosing) {
                return null;
            }
            httpServer.isClosing = true;
            for (const session of sessions) {
                session.socket?.unref();
                session.destroy();
            }
            return new Promise(resolve => {
                server.close(() => setTimeout(resolve, 10));
            });
        },
        baseUrl,
        url: `${baseUrl}/`,
        port,
        server,
    };
    exports.needsClosing.push(httpServer);
    return httpServer;
}
function httpGetWithSocket(url, clientOptions, socket) {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        socket.once('close', () => {
            if (isResolved)
                return;
            reject(new Error('Socket closed before resolve'));
        });
        socket.once('error', err => {
            if (isResolved)
                return;
            reject(err);
        });
        const request = https.get(url, {
            ...clientOptions,
            agent: null,
            createConnection: () => socket,
        }, async (res) => {
            isResolved = true;
            const buffer = await readableToBuffer(res);
            resolve(buffer.toString('utf8'));
        });
        request.on('error', err => {
            if (isResolved)
                return;
            reject(err);
        });
    });
}
let sessionId = 0;
function getTlsConnection(serverPort, host = 'localhost', isWebsocket = false, proxyUrl) {
    const tlsConnection = new unblocked_agent_mitm_socket_1.default(`session${(sessionId += 1)}`, index_1.TestLogger.forTest(module.parent), {
        host,
        port: String(serverPort),
        servername: host,
        isWebsocket,
        isSsl: true,
        proxyUrl,
    });
    index_1.Helpers.onClose(() => tlsConnection.close());
    return tlsConnection;
}
function getLogo() {
    return Fs.readFileSync(`${__dirname}/html/img.png`);
}
async function readableToBuffer(res) {
    const buffer = [];
    for await (const data of res) {
        buffer.push(data);
    }
    return Buffer.concat(buffer);
}
async function beforeEach() {
    index_1.TestLogger.testNumber += 1;
}
function afterEach() {
    return closeAll(false);
}
async function afterAll() {
    await closeAll(true);
}
async function closeAll(isFinal = false) {
    const closeList = [...exports.needsClosing];
    exports.needsClosing.length = 0;
    await Promise.all(closeList.map(async (toClose, i) => {
        if (!toClose.close) {
            // eslint-disable-next-line no-console
            console.log('Error closing', { closeIndex: i });
            return;
        }
        if (toClose.onlyCloseOnFinal && !isFinal) {
            exports.needsClosing.push(toClose);
            return;
        }
        try {
            await toClose.close();
        }
        catch (err) {
            if (err instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            // eslint-disable-next-line no-console
            console.log('Error shutting down', err);
        }
    }));
}
function bindSslListeners(server) {
    if (env_1.default.sslKeylogFile) {
        const logFile = Fs.createWriteStream(env_1.default.sslKeylogFile, { flags: 'a' });
        server.on('keylog', line => logFile.write(line));
    }
}
function onClose(closeFn, onlyCloseOnFinal = false) {
    exports.needsClosing.push({ close: closeFn, onlyCloseOnFinal });
}
function extractPort(url) {
    if (url.port)
        return url.port;
    if (url.protocol === 'https:')
        return 443;
    return 80;
}
function destroyServerFn(server) {
    const connections = new Set();
    server.on('connection', (conn) => {
        connections.add(conn);
        conn.on('close', () => connections.delete(conn));
    });
    return () => new Promise(resolve => {
        for (const conn of connections) {
            conn.destroy();
        }
        server.close(() => {
            setTimeout(resolve, 10);
        });
    });
}
//# sourceMappingURL=helpers.js.map