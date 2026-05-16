"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/analyze/lib/Plugin");
const matchers_1 = require("@double-agent/analyze/lib/matchers");
const scorers_1 = require("@double-agent/analyze/lib/scorers");
const CheckGenerator_1 = require("./lib/CheckGenerator");
class BrowserDom extends Plugin_1.default {
    initialize(profiles) {
        const checks = [];
        for (const profile of profiles) {
            const checkGenerator = new CheckGenerator_1.default(profile);
            checks.push(...checkGenerator.checks);
        }
        this.initializeProbes({
            layerKey: 'DOM',
            layerName: 'Document Object Model',
            checks,
            matcher: matchers_1.PositiveMatcher,
            scorer: scorers_1.DiffGradient,
        });
    }
    runIndividual(profile) {
        const checkGenerator = new CheckGenerator_1.default(profile);
        return this.runProbes('DOM', profile.userAgentId, checkGenerator.checks);
    }
}
exports.default = BrowserDom;
//# sourceMappingURL=index.js.map