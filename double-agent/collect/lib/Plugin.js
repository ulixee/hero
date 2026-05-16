"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const url_1 = require("url");
const events_1 = require("events");
const IAssignment_1 = require("@double-agent/collect-controller/interfaces/IAssignment");
const config_1 = require("@double-agent/config");
const TlsServer_1 = require("../servers/TlsServer");
const HttpServer_1 = require("../servers/HttpServer");
const HttpsServer_1 = require("../servers/HttpsServer");
const DomainUtils_1 = require("./DomainUtils");
const Document_1 = require("./Document");
const Http2Server_1 = require("../servers/Http2Server");
var Protocol;
(function (Protocol) {
    Protocol["all"] = "all";
    Protocol["allHttp1"] = "allHttp1";
    Protocol["http"] = "http";
    Protocol["https"] = "https";
    Protocol["http2"] = "http2";
    Protocol["ws"] = "ws";
    Protocol["wss"] = "wss";
    Protocol["tls"] = "tls";
})(Protocol || (Protocol = {}));
const releasedPorts = [];
let portCounter = config_1.default.collect.pluginStartingPort;
class Plugin extends events_1.EventEmitter {
    constructor(pluginDir) {
        super();
        this.outputFiles = 1;
        this.pagesByAssignmentType = {
            [IAssignment_1.AssignmentType.Individual]: [],
            [IAssignment_1.AssignmentType.OverTime]: [],
        };
        this.routes = {};
        this.tlsServerBySessionId = {};
        this.dir = pluginDir;
        this.id = Path.basename(pluginDir);
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const packageJson = require(`${pluginDir}/package.json`);
        if (packageJson) {
            this.summary = packageJson.description;
        }
        this.initialize();
    }
    pagesForSession(session) {
        return this.pagesByAssignmentType[session.assignmentType].map((page, pageIndex) => {
            return this.convertToSessionPage(page, session.id, pageIndex);
        });
    }
    convertToSessionPage(page, sessionId, pageIndex) {
        const { protocol, path } = page.route;
        const { MainDomain, TlsDomain } = config_1.default.collect.domains;
        const domain = page.domain || (protocol === Protocol.tls ? TlsDomain : MainDomain);
        const server = this.getServer(protocol, sessionId);
        let urlProtocol = protocol;
        if (protocol === Protocol.tls || protocol === Protocol.http2) {
            urlProtocol = Protocol.https;
        }
        const baseUrl = `${urlProtocol}://${domain}:${server.port}`;
        const fullPath = `/${this.id}${path.startsWith('/') ? path : `/${path}`}`;
        let url = new url_1.URL(fullPath, baseUrl).href;
        url = (0, DomainUtils_1.addPageIndexToUrl)(url, pageIndex);
        url = (0, DomainUtils_1.addSessionIdToUrl)(url, sessionId);
        const sessionPage = { url };
        if (page.waitForReady || page.clickNext) {
            sessionPage.waitForElementSelector = Document_1.default.waitForElementSelector;
        }
        if (page.isRedirect) {
            sessionPage.isRedirect = page.isRedirect;
        }
        if (page.clickNext) {
            sessionPage.clickElementSelector = Document_1.default.clickElementSelector;
        }
        return sessionPage;
    }
    async createServersForSession(session) {
        if (!this.pagesByAssignmentType[session.assignmentType].length)
            return;
        const { sessionTracker, pluginDelegate } = session;
        const serverContext = { sessionTracker, pluginDelegate, plugin: this };
        for (const [protocol, routesByPath] of Object.entries(this.routes)) {
            if (protocol === Protocol.ws) {
                await this.createServer(Protocol.http, serverContext, session.id, routesByPath);
                await this.createServer(Protocol.https, serverContext, session.id, routesByPath);
                await this.createServer(Protocol.http2, serverContext, session.id, routesByPath);
            }
            await this.createServer(protocol, serverContext, session.id, routesByPath);
        }
    }
    onServerStart(protocol, callback) {
        this.once(`${protocol}-started`, callback);
    }
    onServerStop(protocol, callback) {
        this.once(`${protocol}-stopped`, callback);
    }
    async stop() {
        await Promise.all([this.http2Server?.stop(), this.httpServer?.stop(), this.httpsServer.stop()]);
        for (const tls of Object.values(this.tlsServerBySessionId)) {
            await tls.stop();
        }
    }
    async closeServersForSession(sessionId) {
        if (!this.tlsServerBySessionId[sessionId])
            return;
        await this.tlsServerBySessionId[sessionId].stop();
        releasedPorts.push(this.tlsServerBySessionId[sessionId].port);
        delete this.tlsServerBySessionId[sessionId];
    }
    getServer(protocol, sessionId, currentProtocol) {
        if (protocol === Protocol.ws || protocol === Protocol.wss) {
            protocol = currentProtocol;
        }
        if (protocol === Protocol.tls) {
            return this.tlsServerBySessionId[sessionId];
        }
        if (protocol === Protocol.http) {
            return this.httpServer;
        }
        if (protocol === Protocol.https) {
            return this.httpsServer;
        }
        if (protocol === Protocol.http2) {
            return this.http2Server;
        }
    }
    registerRoute(protocol, path, handlerFn, preflightHandlerFn) {
        if (protocol === Protocol.all || protocol === Protocol.ws || protocol === Protocol.allHttp1) {
            this.registerRoute(Protocol.http, path, handlerFn, preflightHandlerFn);
            this.registerRoute(Protocol.https, path, handlerFn, preflightHandlerFn);
            if (protocol === Protocol.all) {
                this.registerRoute(Protocol.http2, path, handlerFn, preflightHandlerFn);
            }
            return;
        }
        this.routes[protocol] = this.routes[protocol] || {};
        if (this.routes[protocol][path]) {
            throw new Error(`Path already exists: ${protocol}:${path}`);
        }
        const route = {
            protocol,
            path,
            handlerFn: handlerFn.bind(this),
        };
        if (preflightHandlerFn) {
            route.preflightHandlerFn = preflightHandlerFn.bind(this);
        }
        this.routes[protocol][path] = route;
    }
    registerAsset(protocol, path, handler) {
        if (protocol === Protocol.all || protocol === Protocol.allHttp1) {
            this.registerAsset(Protocol.http, path, handler);
            this.registerAsset(Protocol.https, path, handler);
            if (protocol === Protocol.all) {
                this.registerAsset(Protocol.http2, path, handler);
            }
            return;
        }
        this.routes[protocol] = this.routes[protocol] || {};
        if (this.routes[protocol][path]) {
            throw new Error(`Path already exists: ${protocol}:${path}`);
        }
        this.routes[protocol][path] = {
            protocol,
            path,
            handlerFn: handler.bind(this),
            isAsset: true,
        };
    }
    registerPages(...pages) {
        this.pagesByAssignmentType[IAssignment_1.AssignmentType.Individual] = pages;
    }
    registerPagesOverTime(...pages) {
        this.pagesByAssignmentType[IAssignment_1.AssignmentType.OverTime] = pages;
    }
    async createServer(protocol, serverContext, sessionId, routesByPath) {
        const port = generatePort();
        if (protocol === Protocol.tls) {
            this.tlsServerBySessionId[sessionId] = await new TlsServer_1.default(port, routesByPath).start(serverContext);
            console.log(`${this.id} listening on ${port} (TLS)`);
        }
        else if (protocol === Protocol.http) {
            if (this.httpServer)
                return;
            this.httpServer = await new HttpServer_1.default(port, routesByPath).start(serverContext);
            console.log(`${this.id} listening on ${port} (HTTP)`);
        }
        else if (protocol === Protocol.https) {
            if (this.httpsServer)
                return;
            this.httpsServer = await new HttpsServer_1.default(port, routesByPath).start(serverContext);
            console.log(`${this.id} listening on ${port} (HTTPS)`);
        }
        else if (protocol === Protocol.http2) {
            if (this.http2Server)
                return;
            this.http2Server = await new Http2Server_1.default(port, routesByPath).start(serverContext);
            console.log(`${this.id} listening on ${port} (HTTP2)`);
        }
        this.emit(`${protocol}-started`);
    }
}
exports.default = Plugin;
function generatePort() {
    if (releasedPorts.length) {
        return releasedPorts.shift();
    }
    if (portCounter > config_1.default.collect.pluginMaxPort) {
        portCounter = config_1.default.collect.pluginStartingPort;
        return portCounter++;
    }
    return (portCounter += 1);
}
//# sourceMappingURL=Plugin.js.map