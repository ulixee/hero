"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const createHttpRequestHandler_1 = require("../lib/createHttpRequestHandler");
const createWebsocketHandler_1 = require("../lib/createWebsocketHandler");
const BaseServer_1 = require("./BaseServer");
class HttpServer extends BaseServer_1.default {
    constructor(port, routesByPath) {
        super('http', port, routesByPath);
    }
    async start(context) {
        await super.start(context);
        const options = {};
        this.httpServer = await new Promise(resolve => {
            const httpRequestHandler = (0, createHttpRequestHandler_1.default)(this, context);
            const websocketHandler = (0, createWebsocketHandler_1.default)(this, context);
            const server = http.createServer(options, httpRequestHandler);
            server.on('upgrade', websocketHandler);
            server.listen(this.port, () => resolve(server));
        });
        return this;
    }
    async stop() {
        this.httpServer.close();
        console.log(`HTTP Server closed (port: ${this.port}`);
    }
}
exports.default = HttpServer;
//# sourceMappingURL=HttpServer.js.map