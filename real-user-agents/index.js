"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserAgent_1 = require("./lib/UserAgent");
const Browsers_1 = require("./lib/Browsers");
const OperatingSystems_1 = require("./lib/OperatingSystems");
class RealUserAgents {
    static all(filterMinimumWebdrivable = true) {
        return Object.values(UserAgent_1.default.all()).filter(userAgent => {
            if (!filterMinimumWebdrivable)
                return true;
            const [major] = userAgent.browserBaseVersion;
            const name = userAgent.browserName;
            if (name === 'Chrome' && major < 58)
                return false;
            if (name === 'Edge' && major < 58)
                return false;
            if (name === 'Firefox' && major < 58)
                return false;
            if (name === 'Opera' && major < 58)
                return false;
            if (name === 'Safari' && major < 10)
                return false;
            if (name === 'IE')
                return false;
            return true;
        });
    }
    static getId(userAgentId) {
        return UserAgent_1.default.all()[userAgentId];
    }
    static where(query) {
        let userAgents = this.all();
        if (query.browserId) {
            userAgents = userAgents.filter(x => x.browserId === query.browserId);
        }
        if (query.operatingSystemId) {
            userAgents = userAgents.filter(x => x.operatingSystemId === query.operatingSystemId);
        }
        return userAgents;
    }
    static findById(userAgentId) {
        if (!userAgentId)
            return;
        return UserAgent_1.default.all()[userAgentId];
    }
    static random(countToGet, filterFn) {
        const availableUserAgents = this.all();
        const userAgentCount = availableUserAgents.length;
        const selectedUserAgents = [];
        while (selectedUserAgents.length < countToGet && selectedUserAgents.length < userAgentCount) {
            if (!availableUserAgents.length)
                break;
            const selectedIndex = Math.floor(Math.random() * availableUserAgents.length);
            const userAgent = availableUserAgents.splice(selectedIndex, 1)[0];
            if (filterFn && !filterFn(userAgent))
                continue;
            selectedUserAgents.push(userAgent);
        }
        return selectedUserAgents;
    }
    static popular(marketshareNeeded, filterFn) {
        const sortedUserAgents = this.all().sort((a, b) => b.marketshare - a.marketshare);
        const selectedUserAgents = [];
        let selectedMarketshare = 0;
        for (const userAgent of sortedUserAgents) {
            if (selectedMarketshare > marketshareNeeded)
                break;
            if (filterFn && !filterFn(userAgent))
                continue;
            selectedMarketshare += userAgent.marketshare;
            selectedUserAgents.push(userAgent);
        }
        return selectedUserAgents;
    }
    static getBrowser(browserId) {
        return Browsers_1.default.byId(browserId);
    }
    static getOperatingSystem(operatingSystemid) {
        return OperatingSystems_1.default.byId(operatingSystemid);
    }
    static extractMetaFromUserAgentId(userAgentId) {
        const matches = userAgentId.match(/^(([a-z-]+)(-([0-9-]+))?)--(([a-z-]+)-([0-9-]+))$/);
        const operatingSystemId = matches[1];
        const operatingSystemName = matches[2];
        const operatingSystemVersion = matches[4] || '';
        const browserId = matches[5];
        const browserName = matches[6];
        const browserVersion = matches[7];
        return {
            operatingSystemId,
            operatingSystemName,
            operatingSystemVersion,
            browserId,
            browserName,
            browserVersion,
        };
    }
}
exports.default = RealUserAgents;
//# sourceMappingURL=index.js.map