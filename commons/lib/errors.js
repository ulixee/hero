"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbortError = exports.CodeError = exports.UlixeeError = void 0;
// eslint-disable-next-line max-classes-per-file
const addGlobalInstance_1 = require("./addGlobalInstance");
const TypeSerializer_1 = require("./TypeSerializer");
class UlixeeError extends Error {
    constructor(message, code, data) {
        // Calling parent constructor of base Error class.
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
        this.code = code;
        // Capturing stack trace, excluding constructor call from it.
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            message: this.message,
            ...this,
        };
    }
    toString() {
        const extras = this.data ? `\n${JSON.stringify(this.data, null, 2)}` : '';
        return `${this.message} [${this.code}] ${extras}`;
    }
}
exports.UlixeeError = UlixeeError;
/**
 * When this error is thrown it means an operation was aborted,
 * usually in response to the `abort` event being emitted by an
 * AbortSignal.
 */
class AbortError extends Error {
    constructor(message = 'The operation was aborted') {
        super(message);
        this.code = AbortError.code;
    }
    toString() {
        return `${this.message} [${this.code}]`;
    }
}
exports.AbortError = AbortError;
AbortError.code = 'ABORT_ERR';
class CodeError extends Error {
    constructor(message, code, props) {
        super(message);
        this.code = code;
        this.name = props?.name ?? 'CodeError';
        this.props = props ?? {};
    }
    toString() {
        const extras = this.props ? `\n${JSON.stringify(this.props, null, 2)}` : '';
        return `${this.message} [${this.code}] ${extras}`;
    }
}
exports.CodeError = CodeError;
(0, TypeSerializer_1.registerSerializableErrorType)(CodeError);
(0, TypeSerializer_1.registerSerializableErrorType)(UlixeeError);
(0, TypeSerializer_1.registerSerializableErrorType)(AbortError);
(0, addGlobalInstance_1.default)(UlixeeError, CodeError);
//# sourceMappingURL=errors.js.map