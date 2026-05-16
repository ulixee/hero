"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const WebSocket = require("ws");
const hero_core_1 = require("@ulixee/hero-core");
const net_1 = require("@ulixee/net");
const package_json_1 = require("@ulixee/hero-core/package.json");
const hosts_1 = require("@ulixee/commons/config/hosts");
/**
 * This is a simple HeroCore Server that can be used as a starting point for your own server (or integration with an existing server).
 */
class CoreServer {
    constructor(port) {
        this.addressPromise = new Promise(resolve => {
            this.wsServer = new WebSocket.Server({ port }, () => {
                const address = this.wsServer.address();
                resolve(`localhost:${address.port}`);
            });
        });
        this.wsServer.on('connection', this.handleWsConnection.bind(this));
        ShutdownHandler_1.default.register(() => this.close());
    }
    async open() {
        this.core = await hero_core_1.default.start();
        const address = await this.addressPromise;
        await hosts_1.default.global.setVersionHost(package_json_1.version, address);
        ShutdownHandler_1.default.register(() => hosts_1.default.global.setVersionHost(package_json_1.version, null));
        console.log('Started server at %s', address);
    }
    async close() {
        try {
            this.wsServer.close();
        }
        catch (error) {
            console.log('Error closing socket connections', error);
        }
        await hero_core_1.default.shutdown();
    }
    handleWsConnection(ws, req) {
        const transport = new net_1.WsTransportToClient(ws, req);
        const connection = this.core.addConnection(transport);
        ShutdownHandler_1.default.register(() => connection.disconnect());
    }
}
(async () => {
    const port = parseInt(process.argv[2] ?? '1337', 10);
    const coreServer = new CoreServer(port);
    await coreServer.open();
})().catch(console.error);
//# sourceMappingURL=server.js.map