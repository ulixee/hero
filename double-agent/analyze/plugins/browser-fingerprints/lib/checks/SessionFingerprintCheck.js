"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class SessionFingerprintCheck extends BaseCheck_1.default {
    constructor(identity, meta, fingerprints) {
        super(identity, meta);
        this.prefix = 'SFNG';
        this.type = BaseCheck_1.CheckType.Individual;
        this.fingerprints = fingerprints;
    }
    get signature() {
        return `${this.meta}:${this.constructor.name}`;
    }
    get args() {
        return [this.fingerprints];
    }
    generateHumanScore(check) {
        super.generateHumanScore(check);
        const allMatch = check.fingerprints.every(x => x === check.fingerprints[0]);
        return allMatch ? 100 : 0;
    }
}
exports.default = SessionFingerprintCheck;
//# sourceMappingURL=SessionFingerprintCheck.js.map