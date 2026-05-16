"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsClosing = void 0;
exports.runKoaServer = runKoaServer;
exports.sslCerts = sslCerts;
exports.runHttpsServer = runHttpsServer;
exports.runHttpServer = runHttpServer;
exports.runHttp2Server = runHttp2Server;
exports.waitForElement = waitForElement;
exports.getLogo = getLogo;
exports.readableToBuffer = readableToBuffer;
exports.afterEach = afterEach;
exports.afterAll = afterAll;
exports.onClose = onClose;
exports.createSession = createSession;
const Fs = require("fs");
const Path = require("path");
const Url = require("url");
const querystring = require("querystring");
const http = require("http");
const https = require("https");
const utils_1 = require("@ulixee/commons/lib/utils");
const Koa = require("koa");
const KoaRouter = require("@koa/router");
const KoaMulter = require("@koa/multer");
const http2 = require("http2");
const hero_core_1 = require("@ulixee/hero-core");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const IJsPathFunctions_1 = require("@ulixee/unblocked-specification/agent/browser/IJsPathFunctions");
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
    const { onRequest, onPost, addToResponse } = params;
    const server = http.createServer().unref();
    const destroyServer = destroyServerFn(server);
    server.on('request', async (request, response) => {
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
let domListenerId = 1;
async function waitForElement(jsPath, frame) {
    const listener = frame.tab.addDomStateListener(`${(domListenerId += 1)}`, {
        url: null,
        name: null,
        callsite: `callsite:${domListenerId}`,
        commands: {
            visibility: [
                frame.id,
                'FrameEnvironment.execJsPath',
                [[...jsPath, [IJsPathFunctions_1.getComputedVisibilityFnName]]],
            ],
        },
    });
    return new Promise(resolve => {
        const timeout = setTimeout(() => {
            listener.stop({ didMatch: false });
            resolve();
        }, 30e3);
        listener.on('updated', event => {
            const { visibility } = event;
            if (visibility.value?.nodeExists) {
                resolve();
                listener.stop({ didMatch: true });
                clearTimeout(timeout);
            }
        });
    });
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
function afterEach() {
    return closeAll(false);
}
async function afterAll() {
    await closeAll(true);
    await hero_core_1.default.shutdown();
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
    if (process.env.SSLKEYLOGFILE) {
        const logFile = Fs.createWriteStream(process.env.SSLKEYLOGFILE, { flags: 'a' });
        server.on('keylog', line => logFile.write(line));
    }
}
function onClose(closeFn, onlyCloseOnFinal = false) {
    exports.needsClosing.push({ close: closeFn, onlyCloseOnFinal });
}
let core;
async function createSession(options) {
    core ??= await hero_core_1.default.start();
    const connection = core.addConnection();
    index_1.Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession(options);
    const tab = hero_core_1.Session.getTab(meta);
    index_1.Helpers.needsClosing.push(tab.session);
    return { tab, session: tab.session };
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