"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
require("@ulixee/commons/lib/SourceMapSupport");
let counter = 0;
class EmittingTransportToClient extends eventUtils_1.TypedEventEmitter {
    constructor() {
        super(...arguments);
        this.remoteId = String((counter += 1));
        this.isConnected = true;
    }
    send(message) {
        this.emit('outbound', message);
        return Promise.resolve();
    }
}
exports.default = EmittingTransportToClient;
(0, addGlobalInstance_1.default)(EmittingTransportToClient);
//# sourceMappingURL=EmittingTransportToClient.js.map