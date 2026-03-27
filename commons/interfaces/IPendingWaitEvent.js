"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanceledPromiseError = void 0;
const addGlobalInstance_1 = require("../lib/addGlobalInstance");
const TypeSerializer_1 = require("../lib/TypeSerializer");
class CanceledPromiseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CanceledPromiseError';
    }
}
exports.CanceledPromiseError = CanceledPromiseError;
(0, addGlobalInstance_1.default)(CanceledPromiseError);
(0, TypeSerializer_1.registerSerializableErrorType)(CanceledPromiseError);
//# sourceMappingURL=IPendingWaitEvent.js.map