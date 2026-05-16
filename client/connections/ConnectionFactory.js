"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hosts_1 = require("@ulixee/commons/config/hosts");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const net_1 = require("@ulixee/net");
const ConnectionToHeroCore_1 = require("./ConnectionToHeroCore");
const { version } = require('../package.json');
class ConnectionFactory {
    static createConnection(options, callsiteLocator) {
        if (options instanceof ConnectionToHeroCore_1.default) {
            // NOTE: don't run connect on an instance
            return options;
        }
        let connection;
        if (options.host) {
            const host = Promise.resolve(options.host).then(ConnectionToHeroCore_1.default.resolveHost);
            const transport = new net_1.WsTransportToCore(host);
            connection = new ConnectionToHeroCore_1.default(transport, null, callsiteLocator);
        }
        else {
            const host = hosts_1.default.global.getVersionHost(version);
            if (!host && ConnectionFactory.hasLocalCloudPackage) {
                // If Clouds are launched, but none compatible, propose installing @ulixee/cloud locally
                throw new Error(`A local Ulixee Cloud is not started. From your project, run:\n\nnpx @ulixee/cloud start`);
            }
            if (host) {
                const transport = new net_1.WsTransportToCore(ConnectionToHeroCore_1.default.resolveHost(host));
                connection = new ConnectionToHeroCore_1.default(transport, { ...options, version }, callsiteLocator);
            }
            else if (hosts_1.default.global.hasHosts()) {
                // If Clouds are launched, but none compatible, propose installing @ulixee/cloud locally
                throw new Error(`Your script is using version ${version} of Hero. A compatible Hero Core was not found on localhost. You can fix this by installing and running a local Ulixee Cloud in your project:

npm install --save-dev @ulixee/cloud

npx @ulixee/cloud start
        `);
            }
        }
        if (!connection) {
            throw new Error('Hero Core could not be found locally' +
                '\n' +
                'If you meant to connect to a remote host, include the "host" parameter for your connection');
        }
        const closeFn = () => connection.disconnect();
        ShutdownHandler_1.default.register(closeFn);
        connection.once('disconnected', () => ShutdownHandler_1.default.unregister(closeFn));
        return connection;
    }
}
ConnectionFactory.hasLocalCloudPackage = false;
exports.default = ConnectionFactory;
try {
    require.resolve('@ulixee/cloud');
    ConnectionFactory.hasLocalCloudPackage = true;
}
catch (error) {
    /* no-op */
}
//# sourceMappingURL=ConnectionFactory.js.map