import { BaseScorer } from './scorers';
import { BaseMatcher } from './matchers';
import Probe from './Probe';
import Layer from './Layer';
import { ICheckType } from './checks/BaseCheck';
export default class ProbeBucket {
    id: string;
    layerId: string;
    checkType: ICheckType;
    userAgentIds: string[];
    probes: Probe[];
    matcher: string;
    scorer: string;
    constructor(id: string, layerId: string, checkType: ICheckType, matcher: string, scorer: string, userAgentIds: string[], probes: Probe[]);
    toJSON(): any;
    static create(layer: Layer, probes: Probe[], userAgentIds: string[], matcher: Constructable<BaseMatcher>, scorer: Constructable<BaseScorer>): ProbeBucket;
    static load(probeBucketObj: any, probesById: {
        [id: string]: Probe;
    }): ProbeBucket;
}
type Constructable<T> = new (...args: any[]) => T;
export {};
