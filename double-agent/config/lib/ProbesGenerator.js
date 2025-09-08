"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const getAllPlugins_1 = require("@double-agent/analyze/lib/getAllPlugins");
const index_1 = require("../index");
const ProfileUtils_1 = require("./ProfileUtils");
class ProbesGenerator {
    constructor(profilesDir, userAgentIdsToUse) {
        this.profilePathsMap = {};
        this.totalChecks = 0;
        this.layers = [];
        this.plugins = [];
        for (const userAgentId of Fs.readdirSync(profilesDir)) {
            const profileDir = Path.join(profilesDir, userAgentId);
            if (userAgentIdsToUse && !userAgentIdsToUse.includes(userAgentId))
                continue;
            if (!Fs.lstatSync(profileDir).isDirectory())
                continue;
            (0, ProfileUtils_1.extractProfilePathsMap)(profileDir, userAgentId, this.profilePathsMap);
        }
    }
    async clearBuckets() {
        const probeBucketsDir = Path.join(index_1.default.probesDataDir, 'probe-buckets');
        const probesDir = Path.join(index_1.default.probesDataDir, 'probes');
        await Fs.promises.rm(probeBucketsDir, { recursive: true }).catch(() => null);
        await Fs.promises.rm(probesDir, { recursive: true }).catch(() => null);
    }
    run() {
        this.plugins = (0, getAllPlugins_1.default)();
    }
    save() {
        const probeBucketsDir = Path.join(index_1.default.probesDataDir, 'probe-buckets');
        const probesDir = Path.join(index_1.default.probesDataDir, 'probes');
        const probeIdsDir = Path.join(index_1.default.probesDataDir, 'probe-ids');
        if (!Fs.existsSync(probeBucketsDir))
            Fs.mkdirSync(probeBucketsDir, { recursive: true });
        if (!Fs.existsSync(probesDir))
            Fs.mkdirSync(probesDir, { recursive: true });
        if (!Fs.existsSync(probeIdsDir))
            Fs.mkdirSync(probeIdsDir, { recursive: true });
        for (const plugin of this.plugins) {
            console.log('---------------------------------------');
            console.log(`GET PROFILES ${plugin.id}`);
            const profiledProfiles = this.getProfiles(plugin.id);
            console.log(`LOADED ${plugin.id}`);
            plugin.initialize(profiledProfiles);
            console.log(`SAVING ${plugin.id}`);
            const probeBucketsData = JSON.stringify(plugin.probeBuckets, null, 2);
            Fs.writeFileSync(`${probeBucketsDir}/${plugin.id}.json`, probeBucketsData);
            const probesData = JSON.stringify(plugin.probes, null, 2);
            Fs.writeFileSync(`${probesDir}/${plugin.id}.json`, probesData);
            const probeIdsData = JSON.stringify(index_1.default.probeIdsMap[plugin.id], null, 2);
            Fs.writeFileSync(`${probeIdsDir}/${plugin.id}.json`, probeIdsData);
            this.layers.push(...plugin.layers);
            for (const layer of plugin.layers) {
                const probeBuckets = plugin.probeBuckets.filter(x => x.layerId === layer.id);
                const checkCount = probeBuckets.map(p => p.probes.length).reduce((a, b) => a + b, 0);
                this.totalChecks += checkCount;
                console.log(`${layer.name} (${layer.id} has ${probeBuckets.length} probe buckets (${checkCount} checks)`);
            }
        }
        const layersData = JSON.stringify(this.layers, null, 2);
        Fs.writeFileSync(`${index_1.default.probesDataDir}/layers.json`, layersData);
        console.log('======');
        console.log(`${this.totalChecks} TOTAL CHECKS`);
    }
    getProfiles(pluginId) {
        const profiles = [];
        if (!this.profilePathsMap[pluginId])
            return profiles;
        Object.values(this.profilePathsMap[pluginId]).forEach(profilePath => {
            const profile = (0, ProfileUtils_1.importProfile)(profilePath);
            profiles.push(profile);
        });
        return profiles;
    }
}
exports.default = ProbesGenerator;
//# sourceMappingURL=ProbesGenerator.js.map