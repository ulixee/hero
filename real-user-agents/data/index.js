"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loadData;
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const paths_1 = require("../lib/paths");
async function loadData() {
    const datafiles = Object.entries({
        userAgents: readJsonFile('external-raw/browserstack/userAgents.json'),
        chromiumBuildVersions: readJsonFile('chromiumBuildVersions.json'),
        stableChromeVersions: readJsonFile('stableChromeVersions.json'),
        browserDescriptions: readJsonFile(`manual/browserDescriptions.json`),
        browserReleaseDates: readJsonFile(`manual/browserReleaseDates.json`),
        osDescriptions: readJsonFile(`manual/osDescriptions.json`),
        osReleaseDates: readJsonFile(`manual/osReleaseDates.json`),
        marketshare: readJsonFile(`marketshare.json`),
        windowsPlatformVersions: readJsonFile('manual/windowsUniversalApiMap.json'),
        darwinToMacOsVersionMap: readJsonFile(`os-mappings/darwinToMacOsVersionMap.json`),
        macOsNameToVersionMap: readJsonFile(`os-mappings/macOsNameToVersionMap.json`),
        macOsVersionAliasMap: readJsonFile(`os-mappings/macOsVersionAliasMap.json`),
        winOsNameToVersionMap: readJsonFile(`os-mappings/winOsNameToVersionMap.json`),
        windowsToWindowsVersionMap: readJsonFile(`os-mappings/windowsToWindowsVersionMap.json`),
    });
    const data = {};
    await Promise.all(datafiles.map(async ([key, dataPromise]) => {
        data[key] = await dataPromise;
    }));
    return data;
}
function readJsonFile(path) {
    return (0, fileUtils_1.readFileAsJson)((0, paths_1.getDataFilePath)(path));
}
//# sourceMappingURL=index.js.map