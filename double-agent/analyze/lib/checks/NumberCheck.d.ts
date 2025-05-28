import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
export default class NumberCheck extends BaseCheck {
    readonly prefix = "NUMR";
    readonly type = CheckType.Individual;
    private readonly value;
    private readonly label;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, value: number, label?: string);
    get signature(): string;
    get args(): any[];
}
