"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSerializer_1 = require("../lib/TypeSerializer");
const addGlobalInstance_1 = require("../lib/addGlobalInstance");
class TimeoutError extends Error {
    constructor(message) {
        super(message ?? 'Timeout waiting for promise');
        this.name = 'TimeoutError';
    }
}
exports.default = TimeoutError;
(0, addGlobalInstance_1.default)(TimeoutError);
(0, TypeSerializer_1.registerSerializableErrorType)(TimeoutError);
//# sourceMappingURL=TimeoutError.js.map