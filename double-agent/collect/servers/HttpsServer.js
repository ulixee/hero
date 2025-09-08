"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https = require("https");
const createHttpRequestHandler_1 = require("../lib/createHttpRequestHandler");
const createWebsocketHandler_1 = require("../lib/createWebsocketHandler");
const BaseServer_1 = require("./BaseServer");
const Certs_1 = require("./Certs");
class HttpServer extends BaseServer_1.default {
    constructor(port, routesByPath) {
        super('https', port, routesByPath);
    }
    async start(context) {
        await super.start(context);
        const httpRequestHandler = (0, createHttpRequestHandler_1.default)(this, context);
        const websocketHandler = (0, createWebsocketHandler_1.default)(this, context);
        this.httpsServer = await new Promise((resolve) => {
            const server = https.createServer((0, Certs_1.default)(), httpRequestHandler);
            server.on('upgrade', websocketHandler);
            server.listen(this.port, () => resolve(server));
        });
        return this;
    }
    async stop() {
        this.httpsServer.close();
        console.log(`HTTPS Server closed (port: ${this.port}`);
    }
}
exports.default = HttpServer;
//# sourceMappingURL=HttpsServer.js.map