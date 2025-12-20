export default function deepDiff(lhs: any, rhs: any, prevPath?: string, key?: PropertyKey, compare?: IObjectComparison): IObjectComparison;
export interface IObjectComparison {
    same: string[];
    added: IDiff[];
    removed: IDiff[];
    changed: IDiff[];
    changedOrder: IDiff[];
}
export interface IDiff {
    path: string;
    lhs?: any;
    rhs?: any;
}
