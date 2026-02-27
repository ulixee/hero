import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class AutomationCheck extends BaseCheck {
    readonly prefix = "AUTO";
    readonly type = CheckType.Individual;
    constructor(identity: ICheckIdentity, meta: ICheckMeta);
    get signature(): string;
    get args(): any[];
    generateHumanScore(check: AutomationCheck | null): number;
}
