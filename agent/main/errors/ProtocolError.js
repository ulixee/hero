"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProtocolError extends Error {
    constructor(stack, method, remoteError) {
        let message = `${method}: ${remoteError.message}`;
        if ('data' in remoteError) {
            if (typeof remoteError.data === 'string') {
                message += ` ${remoteError.data}`;
            }
            else {
                message += ` ${JSON.stringify(remoteError.data)}`;
            }
        }
        super(message);
        this.name = 'ProtocolError';
        this.method = method;
        this.stack = stack;
        this.stack = `${this.name}: ${this.message}\n${stack}`;
        this.remoteError = remoteError;
    }
}
exports.default = ProtocolError;
//# sourceMappingURL=ProtocolError.js.map