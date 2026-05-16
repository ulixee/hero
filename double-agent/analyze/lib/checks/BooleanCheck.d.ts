import BaseCheck, { ICheckIdentity, CheckType, ICheckMeta } from './BaseCheck';
export default class BooleanCheck extends BaseCheck {
    readonly prefix = "BOOL";
    readonly type = CheckType.Individual;
    private readonly value;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, value: boolean);
    get signature(): string;
    get args(): any[];
}
