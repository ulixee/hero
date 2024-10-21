"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getStableChromeVersions;
const axios_1 = require("axios");
async function getStableChromeVersions(take) {
    const response = await axios_1.default.get('https://raw.githubusercontent.com/ulixee/chrome-versions/main/versions.json', {
        responseType: 'json',
    });
    const versionsByMajorPresorted = {};
    for (const [version, support] of Object.entries(response.data)) {
        const parts = version.split('.').filter(Boolean).map(Number);
        const major = parts[0];
        versionsByMajorPresorted[major] ??= { id: `chrome-${major}-0`, major, versions: [] };
        versionsByMajorPresorted[major].versions.push({
            fullVersion: version,
            patch: parts[3],
            linux: !!support.linux,
            mac: !!support.mac,
            win: !!support.win32,
        });
        versionsByMajorPresorted[major].versions.sort((a, b) => b.patch - a.patch);
    }
    return Object.entries(versionsByMajorPresorted)
        .sort((a, b) => {
        return Number(b[0]) - Number(a[0]);
    })
        .map(x => x[1])
        .slice(0, take);
}
//# sourceMappingURL=getStableChromeVersions.js.map