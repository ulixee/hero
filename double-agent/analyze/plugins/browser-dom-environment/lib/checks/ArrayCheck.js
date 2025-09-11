"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class ArrayCheck extends BaseCheck_1.default {
    constructor(identity, meta, hasLengthProperty) {
        super(identity, meta);
        this.prefix = 'ARRY';
        this.type = BaseCheck_1.CheckType.Individual;
        this.hasLengthProperty = hasLengthProperty;
    }
    get signature() {
        return `${this.id}:hasLengthProperty=${this.hasLengthProperty}`;
    }
    get args() {
        return [this.hasLengthProperty];
    }
}
exports.default = ArrayCheck;
//# sourceMappingURL=ArrayCheck.js.map