"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const COUNTER_START = 1000;
const layerMetaMap = {};
class ProbeBucket {
    constructor(id, layerId, checkType, matcher, scorer, userAgentIds, probes) {
        this.id = id;
        this.layerId = layerId;
        this.checkType = checkType;
        this.userAgentIds = userAgentIds;
        this.matcher = matcher;
        this.scorer = scorer;
        this.probes = probes;
        if (probes.some((x) => x.checkType !== checkType)) {
            throw new Error('Probes within a ProbeBucket must share the same CheckType');
        }
    }
    toJSON() {
        return {
            id: this.id,
            layerId: this.layerId,
            checkType: this.checkType,
            userAgentIds: this.userAgentIds,
            matcher: this.matcher,
            scorer: this.scorer,
            probeIds: this.probes.map((p) => p.id),
        };
    }
    static create(layer, probes, userAgentIds, matcher, scorer) {
        const id = generateId(layer);
        const layerId = layer.id;
        const checkType = probes[0].checkType;
        return new this(id, layerId, checkType, matcher.name, scorer.name, userAgentIds, probes);
    }
    static load(probeBucketObj, probesById) {
        const probes = probeBucketObj.probeIds.map((id) => probesById[id]);
        const { id, layerId, checkType, userAgentIds, matcher, scorer } = probeBucketObj;
        return new this(id, layerId, checkType, matcher, scorer, userAgentIds, probes);
    }
}
exports.default = ProbeBucket;
// HELPERS //////
function generateId(layer) {
    layerMetaMap[layer.key] = layerMetaMap[layer.key] || {
        counter: COUNTER_START,
        pluginId: layer.pluginId,
    };
    layerMetaMap[layer.key].counter += 1;
    if (layerMetaMap[layer.key].pluginId !== layer.pluginId) {
        throw new Error(`Layer key (${layer.key}) already assigned to ${layer.pluginId} plugin.`);
    }
    return `${layer.key}-${layerMetaMap[layer.key].counter}`;
}
//# sourceMappingURL=ProbeBucket.js.map