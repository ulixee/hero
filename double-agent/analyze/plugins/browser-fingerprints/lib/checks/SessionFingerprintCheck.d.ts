import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class SessionFingerprintCheck extends BaseCheck {
    readonly prefix = "SFNG";
    readonly type = CheckType.Individual;
    private readonly fingerprints;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, fingerprints: string[]);
    get signature(): string;
    get args(): string[][];
    generateHumanScore(check: SessionFingerprintCheck | null): number;
}
