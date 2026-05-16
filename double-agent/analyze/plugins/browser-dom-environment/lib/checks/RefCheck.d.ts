import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class RefCheck extends BaseCheck {
    readonly prefix = "REFR";
    readonly type = CheckType.Individual;
    private readonly value;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string);
    get signature(): string;
    get args(): string[];
}
