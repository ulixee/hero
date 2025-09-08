"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateStableChromeVersions;
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const axios_1 = require("axios");
const paths_1 = require("../lib/paths");
const chromeVersionsPath = (0, paths_1.getDataFilePath)('stableChromeVersions.json');
async function updateStableChromeVersions() {
    const response = await axios_1.default.get('https://raw.githubusercontent.com/ulixee/chrome-versions/main/versions.json', {
        responseType: 'json',
    });
    console.log(response.data);
    const json = response.data;
    const versionsByMajor = {};
    for (const [version, os] of Object.entries(json)) {
        const [major /* zero */, , build, patch] = version.split('.').filter(Boolean).map(Number);
        versionsByMajor[major] ??= { byOs: { mac: [], win: [], linux: [] }, build };
        const byOs = versionsByMajor[major].byOs;
        if (os.mac) {
            byOs.mac.push(patch);
            byOs.mac.sort((a, b) => b - a);
        }
        if (os.linux) {
            byOs.linux.push(patch);
            byOs.linux.sort((a, b) => b - a);
        }
        if (os.win32) {
            byOs.win.push(patch);
            byOs.win.sort((a, b) => b - a);
        }
    }
    const entries = Object.entries(versionsByMajor).sort((a, b) => {
        return Number(b[0]) - Number(a[0]);
    });
    const supportedVersions = [];
    for (const [majorVersion, parts] of entries) {
        supportedVersions.push({
            id: `chrome-${majorVersion}-0`,
            name: 'chrome',
            majorVersion: Number(majorVersion),
            buildVersion: parts.build,
            stablePatchesByOs: parts.byOs,
        });
    }
    await Fs.promises.writeFile(chromeVersionsPath, JSON.stringify(supportedVersions, null, 2));
    console.log('---------------------');
    console.log(`FINISHED exporting supported browsers`);
}
//# sourceMappingURL=updateStableChromeVersions.js.map