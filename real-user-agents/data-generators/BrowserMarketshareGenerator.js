"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BrowserUtils_1 = require("../lib/BrowserUtils");
class BrowserMarketshareGenerator {
    constructor(browserVersions) {
        this.byId = {};
        for (const [rawBrowserString, rawValues] of Object.entries(browserVersions.results)) {
            const matches = rawBrowserString.match(/^([a-z\s]+)\s([\d.]+)/i);
            if (!matches) {
                console.warn(`Could not parse browser string: ${rawBrowserString}`);
                continue;
            }
            const name = matches[1].trim();
            const versionString = matches[2];
            const versionArray = versionString.split('.');
            if (versionArray.length === 1)
                versionArray.push('0');
            const [major, minor] = versionArray;
            const browserId = (0, BrowserUtils_1.createBrowserId)({ name, version: { major, minor } });
            this.byId[browserId] = averagePercent(rawValues.map(v => Number(v)));
        }
    }
    get(key) {
        return this.byId[key] || 0;
    }
    toJSON() {
        return { ...this.byId };
    }
}
exports.default = BrowserMarketshareGenerator;
// HELPER FUNCTIONS
function averagePercent(counts) {
    const avg = Math.round((10 * counts.reduce((tot, vl) => tot + vl, 0)) / counts.length);
    return avg / 10;
}
//# sourceMappingURL=BrowserMarketshareGenerator.js.map