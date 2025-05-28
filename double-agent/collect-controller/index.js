"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
require("@double-agent/config/load");
const collect_1 = require("@double-agent/collect");
const Certs_1 = require("@double-agent/collect/servers/Certs");
const config_1 = require("@double-agent/config");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const Server_1 = require("./lib/Server");
const serverPort = config_1.default.collect.port;
(async function run() {
    (0, Certs_1.checkSetup)();
    // this server loads all the modules in the "detections" directory and runs a bot detector
    const collect = new collect_1.default();
    // this server simply provides assignments for a scraper to follow to "test" their stack
    const server = new Server_1.default(collect, serverPort);
    ShutdownHandler_1.default.register(() => server.close());
    await server.start();
    if (config_1.default.collect.shouldGenerateProfiles) {
        return;
    }
    console.log(''.padEnd(100, '-'));
    console.log(`
Run the suite:
4. Point your scraper at http://localhost:${serverPort} to get your first assignment.
5. Follow the assignment, and then ask this same url for your next assignment. Assignments will be returned until the test suite is completed.
    `);
})().catch(console.error);
//# sourceMappingURL=index.js.map