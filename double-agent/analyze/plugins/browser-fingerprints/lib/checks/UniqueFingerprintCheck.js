"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class UniqueFingerprintCheck extends BaseCheck_1.default {
    constructor(identity, meta, fingerprint) {
        super(identity, meta);
        this.prefix = 'GFNG';
        this.type = BaseCheck_1.CheckType.OverTime;
        this.countsByFingerprint = {};
        this.totalCount = 0;
        this.fingerprint = fingerprint;
    }
    get signature() {
        return `${this.meta}:${this.constructor.name}`;
    }
    get args() {
        return [this.fingerprint];
    }
    generateHumanScore(check, profileCountOverTime) {
        let humanScore = 100;
        super.ensureComparableCheck(check);
        if (!check)
            return humanScore;
        this.countsByFingerprint[check.fingerprint] = this.countsByFingerprint[check.fingerprint] || 0;
        this.countsByFingerprint[check.fingerprint] += 1;
        this.totalCount += 1;
        // Until we're able to perform our own uniqueness probabilities for FingerprintJs, I'm going with the 74% odds
        // mentioned here:
        // https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9
        const oddsOfUniqueId = 0.75;
        const oddsOfSameId = 1 - oddsOfUniqueId;
        const countOfSameId = this.countsByFingerprint[check.fingerprint];
        const pctWithSameId = countOfSameId / profileCountOverTime;
        if (pctWithSameId > oddsOfSameId) {
            const botScore = ((pctWithSameId - oddsOfSameId) / oddsOfUniqueId) * 100;
            humanScore = 100 - botScore;
        }
        return humanScore;
    }
}
exports.default = UniqueFingerprintCheck;
//# sourceMappingURL=UniqueFingerprintCheck.js.map