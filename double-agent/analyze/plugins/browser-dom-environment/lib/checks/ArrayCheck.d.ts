import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class ArrayCheck extends BaseCheck {
    readonly prefix = "ARRY";
    readonly type = CheckType.Individual;
    private readonly hasLengthProperty;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, hasLengthProperty: boolean);
    get signature(): string;
    get args(): boolean[];
}
