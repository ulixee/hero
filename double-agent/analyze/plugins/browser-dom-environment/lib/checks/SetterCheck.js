"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class SetterCheck extends BaseCheck_1.default {
    constructor(identity, meta, data) {
        super(identity, meta);
        this.prefix = 'SETR';
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
exports.default = SetterCheck;
//# sourceMappingURL=SetterCheck.js.map