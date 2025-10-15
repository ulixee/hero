import Layer from './Layer';
import { BaseMatcher } from './matchers';
import { BaseScorer } from './scorers';
import BaseCheck from './checks/BaseCheck';
export default class ProbeBucketGenerator {
    readonly layer: Layer;
    readonly probeBuckets: any[];
    probeCount: number;
    probeBucketCount: number;
    bucketedCheckCount: number;
    bucketedProbeCount: number;
    private readonly meta;
    constructor(pluginId: string, meta: IProbeBucketMeta);
}
type Constructable<T> = new (...args: any[]) => T;
export interface IProbeBucketMeta {
    layerKey?: string;
    layerName: string;
    description?: string;
    matcher: Constructable<BaseMatcher>;
    scorer: Constructable<BaseScorer>;
    checks: BaseCheck[];
}
export {};
