"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InjectedScriptError extends Error {
    constructor(message, pathState) {
        super(message);
        this.pathState = pathState;
        this.name = 'InjectedScriptError';
    }
    toJSON() {
        return {
            message: this.message,
            pathState: this.pathState,
        };
    }
}
exports.default = InjectedScriptError;
//# sourceMappingURL=InjectedScriptError.js.map