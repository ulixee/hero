"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = update;
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const OsGenerator_1 = require("../data-generators/OsGenerator");
const BrowserGenerator_1 = require("../data-generators/BrowserGenerator");
const UserAgentGenerator_1 = require("../data-generators/UserAgentGenerator");
const paths_1 = require("../lib/paths");
const BrowserMarketshareGenerator_1 = require("../data-generators/BrowserMarketshareGenerator");
const OsMarketshareGenerator_1 = require("../data-generators/OsMarketshareGenerator");
const data_1 = require("../data");
const importChromiumData_1 = require("./importChromiumData");
const importDarwinToMacOsVersionMap_1 = require("./importDarwinToMacOsVersionMap");
const updateStableChromeVersions_1 = require("./updateStableChromeVersions");
const updateStatcounterData_1 = require("./updateStatcounterData");
const importOsVersions_1 = require("./importOsVersions");
async function update() {
    await Promise.allSettled([
        (0, updateStatcounterData_1.default)(),
        (0, importChromiumData_1.default)(),
        (0, updateStableChromeVersions_1.default)(),
        (0, importDarwinToMacOsVersionMap_1.default)(),
        (0, importOsVersions_1.default)(),
    ]);
    const data = await (0, data_1.default)();
    await OsGenerator_1.default.run(data);
    await BrowserGenerator_1.default.run(data);
    await UserAgentGenerator_1.default.run(data);
    const [browserVersions, osVersions, macVersions, winVersions] = await Promise.all([
        readStatcounterData('external-raw/statcounter/browser_version.json'),
        readStatcounterData('external-raw/statcounter/os_combined.json'),
        readStatcounterData('external-raw/statcounter/macos_version.json'),
        readStatcounterData('external-raw/statcounter/windows_version.json'),
    ]);
    const browserMarketshareGenerator = new BrowserMarketshareGenerator_1.default(browserVersions);
    const osMarketshareGenerator = new OsMarketshareGenerator_1.default({
        macVersions,
        osVersions,
        winVersions,
    });
    await saveMarketshare({
        byOsId: osMarketshareGenerator.toJSON(),
        byBrowserId: browserMarketshareGenerator.toJSON(),
    });
    // make sure to end
    process.exit();
}
function readStatcounterData(path) {
    return (0, fileUtils_1.readFileAsJson)((0, paths_1.getDataFilePath)(path));
}
function saveMarketshare(marketshare) {
    const filePath = (0, paths_1.getDataFilePath)('marketshare.json');
    return Fs.promises.writeFile(filePath, `${JSON.stringify(marketshare, null, 2)}\n`);
}
if (process.argv[2] === 'run') {
    update().catch(console.error);
}
//# sourceMappingURL=update.js.map