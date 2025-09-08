"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const ProbeBucketGenerator_1 = require("./ProbeBucketGenerator");
const BaseCheck_1 = require("./checks/BaseCheck");
class Plugin {
    constructor(pluginDir) {
        this.probeBuckets = [];
        this.layers = [];
        this.dir = pluginDir;
        this.id = Path.basename(pluginDir);
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const packageJson = require(`${pluginDir}/package.json`);
        if (packageJson) {
            this.summary = packageJson.description;
        }
    }
    get probes() {
        const probesById = {};
        this.probeBuckets.forEach((bucket) => bucket.probes.forEach((probe) => (probesById[probe.id] = probe)));
        return Object.values(probesById);
    }
    initializeProbes(meta) {
        if (meta.layerKey)
            meta.layerKey = meta.layerKey.toLowerCase();
        const probeBucketGenerator = new ProbeBucketGenerator_1.default(this.id, meta);
        this.layers.push(probeBucketGenerator.layer);
        this.probeBuckets.push(...probeBucketGenerator.probeBuckets);
    }
    runProbes(layerKey, userAgentId, checks, profileCountOverTime) {
        layerKey = layerKey.toLowerCase();
        const flags = [];
        const checkType = profileCountOverTime ? BaseCheck_1.CheckType.OverTime : BaseCheck_1.CheckType.Individual;
        const checksBySignature = {};
        const checksById = {};
        for (const check of checks) {
            checksById[check.id] = check;
            checksBySignature[check.signature] = check;
        }
        const layer = this.layers.find((x) => x.key === layerKey);
        if (!layer)
            throw new Error(`${this.id} plugin missing layer key: ${layerKey}`);
        const probeBuckets = this.probeBuckets.filter((x) => {
            return (x.layerId === layer.id && (!x.userAgentIds.length || x.userAgentIds.includes(userAgentId)));
        });
        for (const probeBucket of probeBuckets) {
            for (const probe of probeBucket.probes) {
                if (probe.checkType !== checkType)
                    continue;
                const toCheck = checksBySignature[probe.check.signature];
                const humanScore = probe.check.generateHumanScore(toCheck, profileCountOverTime);
                if (humanScore < 100) {
                    const invalidCheckSignature = checksById[probe.check.id]?.signature ?? '[None Provided]';
                    const probeId = probe.id;
                    const probeBucketId = probeBucket.id;
                    flags.push({
                        pluginId: this.id,
                        userAgentId,
                        humanScore,
                        probeId,
                        probeBucketId,
                        checkId: probe.check.id,
                        checkSignature: probe.check.signature,
                        invalidCheckSignature,
                        checkName: probe.checkName,
                        checkType: probe.checkType,
                        checkMeta: probe.checkMeta,
                        toCheckArgs: toCheck?.args,
                    });
                }
            }
        }
        return flags;
    }
}
exports.default = Plugin;
//# sourceMappingURL=Plugin.js.map