"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tls_server_1 = require("@double-agent/tls-server");
const createTlsRequestHandler_1 = require("../lib/createTlsRequestHandler");
const BaseServer_1 = require("./BaseServer");
const Certs_1 = require("./Certs");
class TlsServer extends BaseServer_1.default {
    constructor(port, routesByPath) {
        super('tls', port, routesByPath);
    }
    async start(context) {
        await super.start(context);
        const tlsRequestHandler = (0, createTlsRequestHandler_1.default)(this, context);
        this.internalServer = new tls_server_1.default((0, Certs_1.tlsCerts)(), tlsRequestHandler);
        await new Promise(resolve => this.internalServer.listen(this.port, resolve));
        this.internalServer.on('error', error => {
            console.log('TlsServer ERROR: ', error);
            if (error.toString().includes('ENOMEM')) {
                process.exit(1);
            }
        });
        return this;
    }
    async stop() {
        this.internalServer.close();
        console.log(`TLS Server closed (port: ${this.port})`);
    }
}
exports.default = TlsServer;
//# sourceMappingURL=TlsServer.js.map