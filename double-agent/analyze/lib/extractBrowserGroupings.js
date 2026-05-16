"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extractBrowserGroupings;
const config_1 = require("@double-agent/config");
const real_user_agents_1 = require("@ulixee/real-user-agents");
function extractBrowserGroupings(userAgentIds) {
    const { idsByGroup, hasAllOf, hasAllExcept, hasNone } = extractGroupedIds(userAgentIds);
    const details = {};
    for (const userAgentId of userAgentIds) {
        const { operatingSystemName: osName, operatingSystemVersion: osVersion, browserName, browserVersion, } = real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId);
        if (hasNone.includes(userAgentId)) {
            details[`${osName}-${osVersion}`] = details[`${osName}-${osVersion}`] || [];
            details[`${osName}-${osVersion}`].push(`${browserName}-${browserVersion}`);
        }
    }
    for (const groupName of Object.keys(hasAllOf).concat(Object.keys(hasAllExcept))) {
        const titleizedGroupName = (groupName.charAt(0).toUpperCase() + groupName.slice(1)).replace('-os-x', '');
        if (hasAllOf[groupName]) {
            details[`AllProfiled${titleizedGroupName}`] = [idsByGroup[groupName].length.toString()];
        }
        else if (hasAllExcept[groupName]) {
            details[`AllProfiled${titleizedGroupName}Except`] = hasAllExcept[groupName];
        }
    }
    return Object.entries(details);
}
function extractGroupedIds(userAgentIds) {
    let idsByGroup;
    let hasAllOf;
    let hasAllExcept;
    let hasNone;
    const browserGrouping = extractGroupedIdsBy(config_1.default.browserNames, userAgentIds);
    const osGrouping = extractGroupedIdsBy(config_1.default.osNames, userAgentIds);
    if (browserGrouping.hasNone.length <= osGrouping.hasNone.length) {
        idsByGroup = browserGrouping.idsByGroup;
        hasAllOf = browserGrouping.hasAllOf;
        hasAllExcept = browserGrouping.hasAllExcept;
        hasNone = browserGrouping.hasNone;
    }
    else {
        idsByGroup = osGrouping.idsByGroup;
        hasAllOf = osGrouping.hasAllOf;
        hasAllExcept = osGrouping.hasAllExcept;
        hasNone = osGrouping.hasNone;
    }
    return { idsByGroup, hasAllOf, hasAllExcept, hasNone };
}
function extractGroupedIdsBy(names, userAgentIds) {
    const idsByGroup = {};
    const hasAllOf = {};
    const hasAllExcept = {};
    const groupedIds = new Set();
    for (const name of names) {
        idsByGroup[name] = config_1.default.findUserAgentIdsByName(name);
        const misses = idsByGroup[name].filter((x) => !userAgentIds.includes(x));
        const matches = userAgentIds.filter((x) => idsByGroup[name].includes(x));
        const groupCount = idsByGroup[name].length;
        const missCount = misses.length;
        const matchCount = matches.length;
        if (matchCount === groupCount) {
            hasAllOf[name] = true;
        }
        else if (matchCount && matchCount > groupCount * 0.66 && missCount <= 5) {
            hasAllExcept[name] = misses;
        }
        else {
            continue;
        }
        matches.forEach((x) => groupedIds.add(x));
    }
    const hasNone = userAgentIds.filter((x) => !groupedIds.has(x));
    return { idsByGroup, hasAllOf, hasAllExcept, hasNone };
}
//# sourceMappingURL=extractBrowserGroupings.js.map