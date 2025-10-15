"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DisconnectedError_1 = require("@ulixee/net/errors/DisconnectedError");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
class DisconnectedFromCoreError extends DisconnectedError_1.default {
    constructor(coreHost) {
        super(`This Hero has been disconnected from Core (coreHost: ${coreHost})`);
        this.coreHost = coreHost;
        this.code = 'DisconnectedFromCore';
        this.name = 'DisconnectedFromCore';
    }
}
exports.default = DisconnectedFromCoreError;
(0, addGlobalInstance_1.default)(DisconnectedFromCoreError);
(0, TypeSerializer_1.registerSerializableErrorType)(DisconnectedFromCoreError);
//# sourceMappingURL=DisconnectedFromCoreError.js.map