import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
export default class DecimalLengthCheck extends BaseCheck {
    readonly prefix = "DECL";
    readonly type = CheckType.Individual;
    private readonly length;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, length: number);
    get signature(): string;
    get args(): any[];
}
