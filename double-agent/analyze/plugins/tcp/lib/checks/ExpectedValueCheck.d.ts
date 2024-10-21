import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class ExpectedValueCheck extends BaseCheck {
    readonly prefix = "EVAL";
    readonly type = CheckType.Individual;
    private readonly expectedValue;
    private readonly value;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, expectedValue: string | number, value: string | number);
    get signature(): string;
    get args(): (string | number)[];
    generateHumanScore(check: ExpectedValueCheck | null): number;
}
