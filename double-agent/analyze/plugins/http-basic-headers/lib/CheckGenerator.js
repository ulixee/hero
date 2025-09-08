"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SharedCheckGenerator_1 = require("@double-agent/analyze/lib/headers/SharedCheckGenerator");
class CheckGenerator {
    constructor(profile) {
        this.checks = [];
        this.profile = profile;
        const { userAgentId, data } = profile;
        this.userAgentId = userAgentId;
        const checks = new SharedCheckGenerator_1.default(userAgentId, data);
        this.checks.push(...checks.createHeaderCaseChecks(), ...checks.createHeaderOrderChecks(), ...checks.createDefaultValueChecks());
    }
}
exports.default = CheckGenerator;
//# sourceMappingURL=CheckGenerator.js.map