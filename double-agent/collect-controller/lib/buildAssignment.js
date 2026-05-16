"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildAssignment;
const real_user_agents_1 = require("@ulixee/real-user-agents");
const IAssignment_1 = require("../interfaces/IAssignment");
function buildAssignment(id, num, userAgentId, type = IAssignment_1.AssignmentType.Individual, userAgentString = null, pickType = null, usagePercent = null) {
    let browserMeta;
    try {
        // can't load browser meta for a regular user
        browserMeta = real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId);
        browserMeta.browserVersion.replace('-', '.');
        browserMeta.operatingSystemVersion.replace('-', '.');
    }
    catch (error) { }
    return {
        id,
        num,
        type,
        userAgentId,
        browserMeta,
        userAgentString,
        pickType,
        usagePercent,
    };
}
//# sourceMappingURL=buildAssignment.js.map