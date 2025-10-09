"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class ClassCheck extends BaseCheck_1.default {
    constructor(identity, meta, data) {
        super(identity, meta);
        this.prefix = 'CLSS';
        this.type = BaseCheck_1.CheckType.Individual;
        this.data = data;
    }
    get signature() {
        const [key] = Object.keys(this.data);
        return `${this.id}:${key}=${this.data[key]}`;
    }
    get args() {
        return [this.data];
    }
}
exports.default = ClassCheck;
//# sourceMappingURL=ClassCheck.js.map