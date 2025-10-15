"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildAllAssignments;
exports.createOverTimeSessionKey = createOverTimeSessionKey;
exports.extractMetaFromOverTimeSessionKey = extractMetaFromOverTimeSessionKey;
const IUserAgentToTest_1 = require("@double-agent/config/interfaces/IUserAgentToTest");
const config_1 = require("@double-agent/config");
const buildAssignment_1 = require("./buildAssignment");
const IAssignment_1 = require("../interfaces/IAssignment");
async function buildAllAssignments(userAgentsToTest) {
    const assignments = [];
    for (const userAgentToTest of userAgentsToTest) {
        const userAgentString = userAgentToTest.string;
        const id = (0, config_1.createUserAgentIdFromIds)(userAgentToTest.operatingSystemId, userAgentToTest.browserId);
        const type = IAssignment_1.AssignmentType.Individual;
        assignments.push((0, buildAssignment_1.default)(id, assignments.length, id, type, userAgentString, null));
    }
    assignments.push(...buildAssignmentsOverTime(userAgentsToTest, IUserAgentToTest_1.UserAgentToTestPickType.popular, assignments.length));
    assignments.push(...buildAssignmentsOverTime(userAgentsToTest, IUserAgentToTest_1.UserAgentToTestPickType.random, assignments.length));
    return assignments;
}
// HELPERS //////////////////
function buildAssignmentsOverTime(userAgentsToTest, pickType, assignmentCount) {
    const type = IAssignment_1.AssignmentType.OverTime;
    const assignments = [];
    const selUserAgents = userAgentsToTest.filter((x) => x.pickTypes.includes(pickType));
    if (!selUserAgents.length)
        return [];
    const sortedUserAgents = selUserAgents.sort((a, b) => {
        return a.usagePercent[pickType] - b.usagePercent[pickType];
    });
    const countByUserAgentId = {};
    while (assignments.length < 100) {
        let userAgentToTest;
        let userAgentString;
        let userAgentId;
        for (userAgentToTest of sortedUserAgents) {
            userAgentString = userAgentToTest.string;
            userAgentId = (0, config_1.createUserAgentIdFromIds)(userAgentToTest.operatingSystemId, userAgentToTest.browserId);
            countByUserAgentId[userAgentId] ??= 0;
            const pctIncluded = (countByUserAgentId[userAgentId] / assignments.length) * 100;
            if (pctIncluded < userAgentToTest.usagePercent[pickType])
                break;
        }
        countByUserAgentId[userAgentId] += 1;
        assignments.push((0, buildAssignment_1.default)(createOverTimeSessionKey(pickType, assignments.length, userAgentId), assignmentCount + assignments.length, userAgentId, type, userAgentString, pickType, userAgentToTest.usagePercent[pickType]));
    }
    return assignments;
}
function createOverTimeSessionKey(pickType, indexPos, userAgentId) {
    return `${pickType}-${indexPos.toString().padStart(2, '0')}:${userAgentId}`;
}
function extractMetaFromOverTimeSessionKey(sessionKey) {
    // this function is used in ScraperReport
    const [pickType, indexPos, userAgentId] = sessionKey.match(/^([a-z]+)-([0-9]+):(.+)$/).slice(1);
    return {
        pickType: pickType,
        indexPos: Number(indexPos),
        userAgentId,
    };
}
//# sourceMappingURL=buildAllAssignments.js.map