"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class AutomationCheck extends BaseCheck_1.default {
    constructor(identity, meta) {
        super(identity, meta);
        this.prefix = 'AUTO';
        this.type = BaseCheck_1.CheckType.Individual;
    }
    get signature() {
        return this.id;
    }
    get args() {
        return [];
    }
    generateHumanScore(check) {
        super.generateHumanScore(check);
        return check ? 0 : 100;
    }
}
exports.default = AutomationCheck;
//# sourceMappingURL=AutomationCheck.js.map