"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scorers_1 = require("@double-agent/analyze/lib/scorers");
const matchers_1 = require("@double-agent/analyze/lib/matchers");
const Plugin_1 = require("@double-agent/analyze/lib/Plugin");
const CheckGenerator_1 = require("./lib/CheckGenerator");
class TcpPlugin extends Plugin_1.default {
    initialize(profiles) {
        const ttlChecks = [];
        const winChecks = [];
        for (const profile of profiles) {
            const checkGenerator = new CheckGenerator_1.default(profile);
            ttlChecks.push(...checkGenerator.ttlChecks);
            winChecks.push(...checkGenerator.winChecks);
        }
        this.initializeProbes({
            layerKey: 'TTL',
            layerName: 'Time-to-Live',
            // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
            checks: ttlChecks,
            matcher: matchers_1.PositiveMatcher,
            scorer: scorers_1.DiffGradient,
        });
        this.initializeProbes({
            layerKey: 'WNS',
            layerName: 'Window Size',
            // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
            checks: winChecks,
            matcher: matchers_1.PositiveMatcher,
            scorer: scorers_1.DiffGradient,
        });
    }
    runIndividual(profile) {
        const checkGenerator = new CheckGenerator_1.default(profile);
        return [
            ...this.runProbes('TTL', profile.userAgentId, checkGenerator.ttlChecks),
            ...this.runProbes('WNS', profile.userAgentId, checkGenerator.winChecks),
        ];
    }
}
exports.default = TcpPlugin;
//# sourceMappingURL=index.js.map