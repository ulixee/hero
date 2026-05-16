import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
export default class DefaultValueCheck extends BaseCheck {
    readonly prefix = "DVAL";
    readonly type = CheckType.Individual;
    private readonly value;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string[]);
    get signature(): string;
    get args(): any[];
}
