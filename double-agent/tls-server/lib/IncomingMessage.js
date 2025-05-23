"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IncomingMessage {
    constructor(data) {
        Object.assign(this, data);
    }
    [Symbol.asyncIterator]() {
        return {
            i: 0,
            next() {
                return Promise.resolve({ value: null, done: true });
            },
        };
    }
}
exports.default = IncomingMessage;
//# sourceMappingURL=IncomingMessage.js.map