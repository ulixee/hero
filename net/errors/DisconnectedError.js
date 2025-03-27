"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
class DisconnectedError extends IPendingWaitEvent_1.CanceledPromiseError {
    constructor(host, message) {
        super(message ?? `This transport has been disconnected (host: ${host})`);
        this.host = host;
        this.code = 'DisconnectedError';
        this.name = 'DisconnectedError';
    }
}
exports.default = DisconnectedError;
(0, addGlobalInstance_1.default)(DisconnectedError);
(0, TypeSerializer_1.registerSerializableErrorType)(DisconnectedError);
//# sourceMappingURL=DisconnectedError.js.map