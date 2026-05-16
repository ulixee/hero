import { IProbeBucketMeta } from './ProbeBucketGenerator';
export default class Layer {
    id: string;
    key: string;
    name: string;
    pluginId: string;
    constructor(id: string, key: string, name: string, pluginId: string);
    static extractKeyFromProbeMeta(meta: IProbeBucketMeta): string;
    static create(key: string, name: string, pluginId: string): Layer;
    static load(obj: any): Layer;
}
