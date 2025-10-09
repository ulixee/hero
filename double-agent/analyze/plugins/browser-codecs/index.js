"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scorers_1 = require("@double-agent/analyze/lib/scorers");
const matchers_1 = require("@double-agent/analyze/lib/matchers");
const Plugin_1 = require("@double-agent/analyze/lib/Plugin");
const CheckGenerator_1 = require("./lib/CheckGenerator");
class BrowserCodecs extends Plugin_1.default {
    initialize(profiledProfiles) {
        const videoChecks = [];
        const audioChecks = [];
        for (const profile of profiledProfiles) {
            const checkGenerator = new CheckGenerator_1.default(profile);
            videoChecks.push(...checkGenerator.videoChecks);
            audioChecks.push(...checkGenerator.audioChecks);
        }
        this.initializeProbes({
            layerKey: 'VCD',
            layerName: 'Video Codecs',
            // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
            checks: videoChecks,
            matcher: matchers_1.PositiveMatcher,
            scorer: scorers_1.DiffGradient,
        });
        this.initializeProbes({
            layerKey: 'ACD',
            layerName: 'Audio Codecs',
            // description: 'Compares mime types and clock rates.',
            checks: audioChecks,
            matcher: matchers_1.PositiveMatcher,
            scorer: scorers_1.DiffGradient,
        });
    }
    runIndividual(profile) {
        const checkGenerator = new CheckGenerator_1.default(profile);
        return [
            ...this.runProbes('VCD', profile.userAgentId, checkGenerator.videoChecks),
            ...this.runProbes('ACD', profile.userAgentId, checkGenerator.audioChecks),
        ];
    }
}
exports.default = BrowserCodecs;
//# sourceMappingURL=index.js.map