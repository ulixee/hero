import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
export default class NumberLengthCheck extends BaseCheck {
    readonly prefix = "NUML";
    readonly type = CheckType.Individual;
    private readonly length;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, length: number);
    get signature(): string;
    get args(): any[];
}
