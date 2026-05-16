"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
class RemoteError extends Error {
    constructor(error) {
        const { type, code, description, stack, data } = error;
        const message = `Remote threw error (${type ?? error.name ?? code}): ${description ?? error.message}`;
        super(message);
        this.type = type;
        this.code = code;
        this.description = description;
        this.stack = stack ?? this.stack;
        this.data = data;
    }
    toString() {
        const extras = this.data ? `\n${JSON.stringify(this.data, null, 2)}` : '';
        const codeMessage = this.code ? `[${this.code}] ` : '';
        return `${this.message}: ${codeMessage}${extras}`;
    }
}
exports.default = RemoteError;
(0, addGlobalInstance_1.default)(RemoteError);
//# sourceMappingURL=RemoteError.js.map