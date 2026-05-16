"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class StacktraceCheck extends BaseCheck_1.default {
    constructor(identity, meta, stacktrace) {
        super(identity, meta);
        this.prefix = 'STCK';
        this.type = BaseCheck_1.CheckType.Individual;
        this.errorClass = stacktrace.split('\n').shift();
    }
    get signature() {
        return `${this.id}:errorClass=${this.errorClass}`;
    }
    get args() {
        return [this.errorClass];
    }
}
exports.default = StacktraceCheck;
//# sourceMappingURL=StacktraceCheck.js.map