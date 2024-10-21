"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class PrototypeCheck extends BaseCheck_1.default {
    constructor(identity, meta, prototypes) {
        super(identity, meta);
        this.prefix = 'PRTO';
        this.type = BaseCheck_1.CheckType.Individual;
        this.prototypes = (prototypes ?? []).sort();
    }
    get signature() {
        return `${this.id}:${this.prototypes.join(',')}`;
    }
    get args() {
        return [this.prototypes];
    }
}
exports.default = PrototypeCheck;
//# sourceMappingURL=PrototypeCheck.js.map