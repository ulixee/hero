import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class FlagsCheck extends BaseCheck {
    readonly prefix = "FLAG";
    readonly type = CheckType.Individual;
    private readonly flags;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, flags: string[]);
    get signature(): string;
    get args(): string[][];
}
