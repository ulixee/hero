"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class KeyOrderCheck extends BaseCheck_1.default {
    constructor(identity, meta, keys) {
        super(identity, meta);
        this.prefix = 'KORD';
        this.type = BaseCheck_1.CheckType.Individual;
        this.keys = keys;
    }
    get signature() {
        return `${this.id}:${this.keys.join(',')}`;
    }
    get args() {
        return [this.keys];
    }
}
exports.default = KeyOrderCheck;
//# sourceMappingURL=KeyOrderCheck.js.map