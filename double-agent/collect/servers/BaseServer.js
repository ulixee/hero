"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http2 = require("http2");
const url_1 = require("url");
class BaseServer {
    constructor(protocol, port, routesByPath) {
        this.routesByPath = {};
        this.protocol = protocol;
        this.port = port;
        this.routesByPath = routesByPath;
    }
    get plugin() {
        return this.context.plugin;
    }
    async start(context) {
        this.context = context;
        return this;
    }
    getRequestUrl(req) {
        const host = req instanceof http2.Http2ServerRequest ? req.authority : req.headers.host;
        return new url_1.URL(`${this.protocol}://${host}${req.url}`);
    }
    cleanPath(rawPath) {
        return rawPath.replace(new RegExp(`^/${this.plugin.id}`), '');
    }
    getHandlerFn(rawPath) {
        const cleanedPath = this.cleanPath(rawPath);
        return this.routesByPath[cleanedPath]?.handlerFn;
    }
    getRoute(rawPath) {
        const cleanedPath = this.cleanPath(rawPath);
        return this.routesByPath[cleanedPath];
    }
}
exports.default = BaseServer;
//# sourceMappingURL=BaseServer.js.map