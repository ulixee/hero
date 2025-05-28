"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class FunctionCheck extends BaseCheck_1.default {
    constructor(identity, meta, codeString, methods, invocation) {
        super(identity, meta);
        this.prefix = 'FUNC';
        this.type = BaseCheck_1.CheckType.Individual;
        this.codeString = codeString;
        this.methods = methods;
        this.invocation = invocation;
    }
    get signature() {
        const methods = Object.entries(this.methods)
            .map((name, value) => `${name}=${value}`)
            .join(';');
        return `${this.id}:codeString=${this.codeString};${methods};invocation=${this.invocation}`;
    }
    get args() {
        return [this.codeString, this.methods, this.invocation];
    }
}
exports.default = FunctionCheck;
//# sourceMappingURL=FunctionCheck.js.map