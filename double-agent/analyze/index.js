"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const Path = require("path");
const IUserAgentToTest_1 = require("@double-agent/config/interfaces/IUserAgentToTest");
const ProfileUtils_1 = require("@double-agent/config/lib/ProfileUtils");
const getAllPlugins_1 = require("./lib/getAllPlugins");
const Probe_1 = require("./lib/Probe");
const ProbeBucket_1 = require("./lib/ProbeBucket");
const Layer_1 = require("./lib/Layer");
class Analyze {
    constructor(profileCountOverTime, probesDataDir) {
        this.plugins = [];
        this.resultsMap = {
            byUserAgentId: {},
            byPickType: {
                [IUserAgentToTest_1.UserAgentToTestPickType.popular]: [],
                [IUserAgentToTest_1.UserAgentToTestPickType.random]: [],
            },
        };
        this.profileCountOverTime = profileCountOverTime;
        this.probesDataDir = probesDataDir;
        this.plugins = loadAllPlugins(this.probesDataDir);
    }
    addIndividual(individualsDir, userAgentId) {
        this.resultsMap.byUserAgentId[userAgentId] = [];
        const profileDir = Path.join(individualsDir, userAgentId, 'raw-data');
        const profilePathsMap = (0, ProfileUtils_1.extractProfilePathsMap)(profileDir, userAgentId);
        for (const plugin of this.plugins) {
            const profilePathsByUserAgentId = profilePathsMap[plugin.id];
            if (!profilePathsByUserAgentId) {
                console.log(`${userAgentId} IS MISSING ${plugin.id}`);
                continue;
            }
            const profilePath = profilePathsByUserAgentId[userAgentId];
            if (!profilePath)
                continue;
            const profile = (0, ProfileUtils_1.importProfile)(profilePath);
            if (plugin.runIndividual) {
                const flags = plugin.runIndividual(profile);
                this.resultsMap.byUserAgentId[userAgentId].push(...flags);
            }
        }
        return this.resultsMap.byUserAgentId[userAgentId];
    }
    addOverTime(sessionsDir, pickType) {
        const plugins = loadAllPlugins(this.probesDataDir);
        if (!Fs.existsSync(sessionsDir))
            return [];
        const dirNames = Fs.readdirSync(sessionsDir)
            .filter((x) => x.startsWith(pickType))
            .sort();
        for (const dirName of dirNames) {
            const userAgentId = dirName.match(/^[^:]+:(.+)$/)[1];
            const flags = [];
            const profileDir = Path.join(sessionsDir, dirName, 'raw-data');
            const profilePathsMap = (0, ProfileUtils_1.extractProfilePathsMap)(profileDir, userAgentId);
            for (const plugin of plugins) {
                if (!profilePathsMap[plugin.id] || !profilePathsMap[plugin.id][userAgentId])
                    continue;
                const profilePath = profilePathsMap[plugin.id][userAgentId];
                const profile = (0, ProfileUtils_1.importProfile)(profilePath);
                if (plugin.runOverTime) {
                    flags.push(...plugin.runOverTime(profile, dirNames.length));
                }
            }
            this.resultsMap.byPickType[pickType].push({ userAgentId, flags });
        }
        return this.resultsMap.byPickType[pickType];
    }
    generateTestResults() {
        const humanScoreMap = {
            total: {
                [IUserAgentToTest_1.UserAgentToTestPickType.popular]: 100,
                [IUserAgentToTest_1.UserAgentToTestPickType.random]: 100,
            },
            individualByUserAgentId: {},
            sessionsByPickType: {
                [IUserAgentToTest_1.UserAgentToTestPickType.popular]: [],
                [IUserAgentToTest_1.UserAgentToTestPickType.random]: [],
            },
        };
        for (const userAgentId of Object.keys(this.resultsMap.byUserAgentId)) {
            const humanScore = this.resultsMap.byUserAgentId[userAgentId].reduce((score, flag) => {
                return Math.min(score, flag.humanScore);
            }, 100);
            humanScoreMap.individualByUserAgentId[userAgentId] = humanScore;
        }
        const pickTypes = [IUserAgentToTest_1.UserAgentToTestPickType.popular, IUserAgentToTest_1.UserAgentToTestPickType.random];
        for (const pickType of pickTypes) {
            const sessionDetails = [];
            for (const sessionResult of this.resultsMap.byPickType[pickType]) {
                const { userAgentId, flags } = sessionResult;
                const humanScoreIndividual = humanScoreMap.individualByUserAgentId[userAgentId];
                const humanScoreOverTime = flags.reduce((score, flag) => Math.min(score, flag.humanScore), 100);
                let humanScoreTotal = humanScoreIndividual + humanScoreOverTime / 2;
                if (humanScoreTotal > 100)
                    humanScoreTotal = 100;
                if (humanScoreTotal < 0)
                    humanScoreTotal = 0;
                sessionDetails.push({
                    userAgentId,
                    humanScore: {
                        individual: humanScoreIndividual,
                        overTime: humanScoreOverTime,
                        total: humanScoreTotal,
                    },
                });
            }
            humanScoreMap.sessionsByPickType[pickType] = sessionDetails;
            humanScoreMap.total[pickType] = sessionDetails
                .map((x) => x.humanScore.total)
                .reduce((a, b) => Math.min(a, b), 100);
        }
        console.log('humanScoreMap: ', humanScoreMap);
        return humanScoreMap;
    }
}
exports.default = Analyze;
// HELPERS
function loadAllPlugins(probesDataDir) {
    const plugins = (0, getAllPlugins_1.default)();
    for (const plugin of plugins) {
        const layersPath = Path.join(probesDataDir, 'layers.json');
        const probesPath = Path.join(probesDataDir, 'probes', `${plugin.id}.json`);
        const probeBucketsPath = Path.join(probesDataDir, 'probe-buckets', `${plugin.id}.json`);
        const probesById = {};
        const probeObjs = JSON.parse(Fs.readFileSync(probesPath, 'utf-8'));
        probeObjs.forEach((probeObj) => {
            probesById[probeObj.id] = Probe_1.default.load(probeObj, plugin.id);
        });
        const probeBucketObjs = JSON.parse(Fs.readFileSync(probeBucketsPath, 'utf-8'));
        plugin.probeBuckets = probeBucketObjs.map((obj) => {
            return ProbeBucket_1.default.load(obj, probesById);
        });
        const layerObjs = JSON.parse(Fs.readFileSync(layersPath, 'utf-8')).filter((x) => x.pluginId === plugin.id);
        plugin.layers = layerObjs.map((obj) => Layer_1.default.load(obj));
    }
    return plugins;
}
//# sourceMappingURL=index.js.map