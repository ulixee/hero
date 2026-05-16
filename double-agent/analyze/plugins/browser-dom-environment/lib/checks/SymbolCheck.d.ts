import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class SymbolCheck extends BaseCheck {
    readonly prefix = "SYMB";
    readonly type = CheckType.Individual;
    private readonly value;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string);
    get signature(): string;
    get args(): string[];
}
