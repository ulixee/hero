"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OsUtils_1 = require("../lib/OsUtils");
class OsMarketshareGenerator {
    constructor(statcounter) {
        this.byId = {};
        const { macVersions, osVersions, winVersions } = statcounter;
        const macPct = averagePercent(osVersions.results['OS X'].map(s => Number(s)));
        for (const [rawOsString, rawValues] of Object.entries(macVersions.results)) {
            const id = extractOsId(rawOsString);
            this.byId[id] = extractMarketshare(rawValues, macPct);
        }
        const winPct = averagePercent(osVersions.results.Windows.map(s => Number(s)));
        for (const [rawOsString, rawValues] of Object.entries(winVersions.results)) {
            const id = extractOsId(rawOsString);
            this.byId[id] = extractMarketshare(rawValues, winPct);
        }
    }
    get(key) {
        return this.byId[key];
    }
    toJSON() {
        return { ...this.byId };
    }
}
exports.default = OsMarketshareGenerator;
// HELPER FUNCTIONS
function averagePercent(counts) {
    const avg = Math.round((10 * counts.reduce((tot, vl) => tot + vl, 0)) / counts.length);
    return avg / 10;
}
function extractOsId(rawOsString) {
    const osString = cleanOsString(rawOsString);
    const name = (0, OsUtils_1.createOsName)(osString);
    const version = extractVersion(osString, name);
    return (0, OsUtils_1.createOsId)({ name, version });
}
function extractMarketshare(rawValues, osPct) {
    const percents = rawValues.map(x => (Number(x) * osPct) / 100);
    return averagePercent(percents);
}
function cleanOsString(osString) {
    return osString
        .replace('macOS', 'OS X')
        .replace('mac OS X', 'OS X')
        .replace('OS X 10.15', 'OS X Catalina');
}
function extractVersion(osString, osName) {
    const versionString = osString.replace('Win', '').replace('OS X', '').trim();
    if (versionString === 'Other') {
        return {
            name: versionString,
            major: '0',
            minor: '0',
        };
    }
    const [majorVersion, minorVersion] = versionString.split('.');
    return (0, OsUtils_1.createOsVersion)(osName, majorVersion, minorVersion);
}
//# sourceMappingURL=OsMarketshareGenerator.js.map