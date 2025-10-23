"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class ExpectedValueCheck extends BaseCheck_1.default {
    constructor(identity, meta, expectedValues, value) {
        super(identity, meta);
        this.prefix = 'EVLS';
        this.type = BaseCheck_1.CheckType.Individual;
        this.expectedValues = expectedValues;
        this.value = value;
    }
    get signature() {
        return `${this.id}:${this.expectedValues.join(',')}`;
    }
    get args() {
        return [this.expectedValues, this.value];
    }
    generateHumanScore(check) {
        super.generateHumanScore(check);
        return 100;
    }
}
exports.default = ExpectedValueCheck;
//# sourceMappingURL=ExpectedValuesCheck.js.map