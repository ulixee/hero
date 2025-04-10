import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class ExpectedValueCheck extends BaseCheck {
    readonly prefix = "EVLS";
    readonly type = CheckType.Individual;
    private readonly expectedValues;
    private readonly value;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, expectedValues: (string | number)[], value: string | number);
    get signature(): string;
    get args(): (string | number | (string | number)[])[];
    generateHumanScore(check: ExpectedValueCheck | null): number;
}
