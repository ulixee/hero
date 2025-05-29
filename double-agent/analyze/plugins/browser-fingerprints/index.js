"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scorers_1 = require("@double-agent/analyze/lib/scorers");
const matchers_1 = require("@double-agent/analyze/lib/matchers");
const Plugin_1 = require("@double-agent/analyze/lib/Plugin");
const CheckGenerator_1 = require("./lib/CheckGenerator");
class BrowserFingerprints extends Plugin_1.default {
    initialize(profiles) {
        const checks = [];
        for (const profile of profiles) {
            const checkGenerator = new CheckGenerator_1.default(profile);
            checks.push(...checkGenerator.checks);
        }
        this.initializeProbes({
            layerKey: 'FNG',
            layerName: 'Fingerprints',
            // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
            checks,
            matcher: matchers_1.PositiveMatcher,
            scorer: scorers_1.DiffGradient,
        });
    }
    runIndividual(profile) {
        const checkGenerator = new CheckGenerator_1.default(profile);
        return this.runProbes('FNG', profile.userAgentId, checkGenerator.checks);
    }
    runOverTime(profile, profileCountOverTime) {
        if (!profileCountOverTime) {
            throw new Error('profileCountOverTime must be > 0');
        }
        const checkGenerator = new CheckGenerator_1.default(profile);
        return this.runProbes('FNG', profile.userAgentId, checkGenerator.checks, profileCountOverTime);
    }
}
exports.default = BrowserFingerprints;
//# sourceMappingURL=index.js.map