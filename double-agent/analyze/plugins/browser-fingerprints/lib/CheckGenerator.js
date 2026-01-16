"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionFingerprintCheck_1 = require("./checks/SessionFingerprintCheck");
const UniqueFingerprintCheck_1 = require("./checks/UniqueFingerprintCheck");
class CheckGenerator {
    constructor(profile) {
        this.checks = [];
        this.profile = profile;
        this.extractChecks();
    }
    extractChecks() {
        const { userAgentId } = this.profile;
        const fingerprints = this.profile.data.map(x => x.browserHash);
        this.checks.push(new SessionFingerprintCheck_1.default({ userAgentId }, { path: 'fingerprint-js' }, fingerprints));
        this.checks.push(new UniqueFingerprintCheck_1.default({ isUniversal: true }, { path: 'fingerprint-js' }, fingerprints[0]));
    }
}
exports.default = CheckGenerator;
//# sourceMappingURL=CheckGenerator.js.map