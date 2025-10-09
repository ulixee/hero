import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
export default class StringArrayCheck extends BaseCheck {
    readonly prefix: string;
    readonly type = CheckType.Individual;
    protected readonly value: string;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string);
    get signature(): string;
    get args(): any[];
}
