import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class PrototypeCheck extends BaseCheck {
    readonly prefix = "PRTO";
    readonly type = CheckType.Individual;
    private readonly prototypes;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, prototypes: string[]);
    get signature(): string;
    get args(): string[][];
}
