import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import { IProbeBucketMeta } from './ProbeBucketGenerator';
import ProbeBucket from './ProbeBucket';
import Layer from './Layer';
import BaseCheck, { ICheckMeta, ICheckType } from './checks/BaseCheck';
import Probe from './Probe';
export default abstract class Plugin {
    id: string;
    dir: string;
    summary: string;
    probeBuckets: ProbeBucket[];
    layers: Layer[];
    constructor(pluginDir: string);
    get probes(): Probe[];
    abstract initialize(profiles: IBaseProfile[]): void;
    runIndividual?(profile: IBaseProfile): IResultFlag[];
    runOverTime?(profile: IBaseProfile, profileCountOverTime: number): IResultFlag[];
    protected initializeProbes(meta: IProbeBucketMeta): void;
    protected runProbes(layerKey: string, userAgentId: string, checks: BaseCheck[], profileCountOverTime?: number): IResultFlag[];
}
export interface IResultFlag {
    userAgentId: string;
    humanScore: number;
    probeId: string;
    pluginId: string;
    probeBucketId: string;
    checkId: string;
    checkSignature: string;
    invalidCheckSignature: string;
    checkName: string;
    checkType: ICheckType;
    checkMeta: ICheckMeta;
    toCheckArgs: any[];
}
