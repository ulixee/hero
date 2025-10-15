"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = analyzeAssignmentResults;
const fs_1 = require("fs");
const Path = require("path");
const analyze_1 = require("@double-agent/analyze");
const paths_1 = require("@double-agent/config/paths");
const IUserAgentToTest_1 = require("@double-agent/config/interfaces/IUserAgentToTest");
const buildAllAssignments_1 = require("@double-agent/collect-controller/lib/buildAllAssignments");
const zlib_1 = require("zlib");
async function analyzeAssignmentResults(assignmentsDataDir, resultsDir) {
    const userAgentIds = await fs_1.promises.readdir(`${assignmentsDataDir}/individual`);
    const analyze = new analyze_1.default(userAgentIds.length, paths_1.probesDataDir);
    for (const userAgentId of userAgentIds) {
        const dir = `${assignmentsDataDir}/individual/${userAgentId}/raw-data`;
        const files = await fs_1.promises.readdir(dir);
        for (const compressed of files.filter(x => x.endsWith('.gz'))) {
            await new Promise(resolve => (0, fs_1.createReadStream)(Path.join(dir, compressed))
                .pipe((0, zlib_1.createGunzip)())
                .pipe((0, fs_1.createWriteStream)(`${dir}/${compressed.replace('.gz', '')}`))
                .on('finish', resolve));
        }
    }
    for (const userAgentId of userAgentIds) {
        const flags = analyze.addIndividual(`${assignmentsDataDir}/individual`, userAgentId);
        const saveFlagsToDir = Path.resolve(resultsDir, userAgentId);
        await saveFlagsToPluginFiles(saveFlagsToDir, flags);
    }
    for (const pickType of [IUserAgentToTest_1.UserAgentToTestPickType.popular, IUserAgentToTest_1.UserAgentToTestPickType.random]) {
        const sessionsDir = Path.resolve(assignmentsDataDir, `overtime-${pickType}`);
        const userAgentIdFlagsMapping = analyze.addOverTime(sessionsDir, pickType);
        let i = 0;
        for (const userAgentId of Object.keys(userAgentIdFlagsMapping)) {
            const flags = userAgentIdFlagsMapping[userAgentId];
            const sessionKey = (0, buildAllAssignments_1.createOverTimeSessionKey)(pickType, i, userAgentId);
            const flagsDir = Path.resolve(sessionsDir, sessionKey, `flags`);
            await saveFlagsToPluginFiles(flagsDir, [flags]);
            i++;
        }
    }
    const testResults = analyze.generateTestResults();
    testResults.__SCORING__ =
        'Scores are on scale of 0 (low) to 100 (high) on how "human" the traffic looks. 0 are fails.';
    testResults.__NOTE__ =
        'The Total Scores are output of tests that are currently not active that test fingerprints "over time" for various agents. Ie, if you use Chrome 104 100 times, what common signatures are emitted.';
    const testResultsPath = Path.resolve(resultsDir, `testResults.json`);
    await fs_1.promises.writeFile(testResultsPath, JSON.stringify(testResults, null, 2));
}
async function saveFlagsToPluginFiles(saveToDir, flags) {
    const flagsByPluginId = {};
    flags.forEach(flag => {
        flagsByPluginId[flag.pluginId] = flagsByPluginId[flag.pluginId] || [];
        flagsByPluginId[flag.pluginId].push(flag);
    });
    await fs_1.promises.mkdir(saveToDir, { recursive: true });
    for (const pluginId of Object.keys(flagsByPluginId)) {
        const filePath = Path.resolve(saveToDir, `${pluginId}.json`);
        await fs_1.promises.writeFile(filePath, JSON.stringify(flagsByPluginId[pluginId], null, 2));
        const signaturesFilePath = Path.resolve(saveToDir, `${pluginId}-signatures.json`);
        await fs_1.promises.writeFile(signaturesFilePath, JSON.stringify(flagsByPluginId[pluginId].map(x => x.checkSignature), null, 2));
    }
}
//# sourceMappingURL=analyzeAssignmentResults.js.map