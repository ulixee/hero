"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class ExpectedValueCheck extends BaseCheck_1.default {
    constructor(identity, meta, expectedValue, value) {
        super(identity, meta);
        this.prefix = 'EVAL';
        this.type = BaseCheck_1.CheckType.Individual;
        this.expectedValue = expectedValue;
        this.value = value;
    }
    get signature() {
        return `${this.id}:${this.expectedValue}`;
    }
    get args() {
        return [this.expectedValue, this.value];
    }
    generateHumanScore(check) {
        super.generateHumanScore(check);
        return 100;
    }
}
exports.default = ExpectedValueCheck;
//# sourceMappingURL=ExpectedValueCheck.js.map