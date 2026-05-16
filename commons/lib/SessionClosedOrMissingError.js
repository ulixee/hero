"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("../interfaces/IPendingWaitEvent");
const TypeSerializer_1 = require("./TypeSerializer");
class SessionClosedOrMissingError extends IPendingWaitEvent_1.CanceledPromiseError {
    constructor(message) {
        super(message);
        this.name = 'SessionClosedOrMissingError';
    }
}
exports.default = SessionClosedOrMissingError;
(0, TypeSerializer_1.registerSerializableErrorType)(SessionClosedOrMissingError);
//# sourceMappingURL=SessionClosedOrMissingError.js.map