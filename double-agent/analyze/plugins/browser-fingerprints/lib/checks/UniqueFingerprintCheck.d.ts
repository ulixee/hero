import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class UniqueFingerprintCheck extends BaseCheck {
    readonly prefix = "GFNG";
    readonly type = CheckType.OverTime;
    readonly fingerprint: string;
    private readonly countsByFingerprint;
    private totalCount;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, fingerprint: string);
    get signature(): string;
    get args(): string[];
    generateHumanScore(check: UniqueFingerprintCheck | null, profileCountOverTime: number): number;
}
