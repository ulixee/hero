import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
export default class PathCheck extends BaseCheck {
    readonly prefix = "PATH";
    readonly type = CheckType.Individual;
    constructor(identity: ICheckIdentity, meta: ICheckMeta);
    get signature(): string;
    get args(): any[];
}
