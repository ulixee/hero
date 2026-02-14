"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class FlagsCheck extends BaseCheck_1.default {
    constructor(identity, meta, flags) {
        super(identity, meta);
        this.prefix = 'FLAG';
        this.type = BaseCheck_1.CheckType.Individual;
        this.flags = (flags ?? []).sort();
    }
    get signature() {
        return `${this.id}:${this.flags.join('')}`;
    }
    get args() {
        return [this.flags];
    }
}
exports.default = FlagsCheck;
//# sourceMappingURL=FlagsCheck.js.map