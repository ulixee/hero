"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const real_user_agents_1 = require("@ulixee/real-user-agents");
const ExpectedValueCheck_1 = require("./checks/ExpectedValueCheck");
const ExpectedValuesCheck_1 = require("./checks/ExpectedValuesCheck");
class CheckGenerator {
    constructor(profile) {
        this.ttlChecks = [];
        this.winChecks = [];
        this.profile = profile;
        this.extractTtlChecks();
        this.extractWindowSizeChecks();
    }
    extractTtlChecks() {
        const { userAgentId } = this.profile;
        const { operatingSystemName } = real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId);
        const expectedValue = expectedTtlValues[operatingSystemName];
        const check = new ExpectedValueCheck_1.default({ userAgentId }, { path: 'time-to-live' }, expectedValue, this.profile.data.ttl);
        this.ttlChecks.push(check);
    }
    extractWindowSizeChecks() {
        const { userAgentId } = this.profile;
        const { operatingSystemName, operatingSystemVersion } = real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId);
        let expectedValues = expectedWindowSizes[operatingSystemName];
        if (operatingSystemName === 'windows') {
            const windowsVersion = Number(operatingSystemVersion.split('-', 1)) >= 10 ? '10' : '7';
            expectedValues = expectedWindowSizes[operatingSystemName][windowsVersion];
        }
        if (!expectedValues) {
            console.log('WARN: No expected window sizes found', userAgentId);
        }
        const check = new ExpectedValuesCheck_1.default({ userAgentId }, { path: 'window-sizes' }, expectedValues, this.profile.data.windowSize);
        this.winChecks.push(check);
    }
}
exports.default = CheckGenerator;
const expectedTtlValues = {
    'mac-os-x': 64,
    linux: 64,
    windows: 128,
};
const expectedWindowSizes = {
    'mac-os': [65535],
    linux: [5840, 29200, 5720],
    windows: {
        7: [8192],
        10: [64240, 65535],
    },
};
//# sourceMappingURL=CheckGenerator.js.map