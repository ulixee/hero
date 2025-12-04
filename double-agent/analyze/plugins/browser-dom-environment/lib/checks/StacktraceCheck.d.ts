import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class StacktraceCheck extends BaseCheck {
    readonly prefix = "STCK";
    readonly type = CheckType.Individual;
    private readonly errorClass;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, stacktrace: string);
    get signature(): string;
    get args(): string[];
}
