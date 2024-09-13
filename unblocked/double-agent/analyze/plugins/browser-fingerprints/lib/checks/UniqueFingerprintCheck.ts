import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class UniqueFingerprintCheck extends BaseCheck {
  public readonly prefix = 'GFNG';
  public readonly type = CheckType.OverTime;

  public readonly fingerprint: string;

  private readonly countsByFingerprint: { [fingerprint: string]: number } = {};
  private totalCount = 0;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, fingerprint: string) {
    super(identity, meta);
    this.fingerprint = fingerprint;
  }

  public get signature() {
    return `${this.meta}:${this.constructor.name}`;
  }

  public get args() {
    return [this.fingerprint];
  }

  public override generateHumanScore(
    check: UniqueFingerprintCheck | null,
    profileCountOverTime: number,
  ): number {
    let humanScore = 100;
    super.ensureComparableCheck(check);
    if (!check) return humanScore;

    this.countsByFingerprint[check.fingerprint] = this.countsByFingerprint[check.fingerprint] || 0;
    this.countsByFingerprint[check.fingerprint] += 1;
    this.totalCount += 1;

    // Until we're able to perform our own uniqueness probabilities for FingerprintJs, I'm going with the 74% odds
    // mentioned here:
    // https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9
    const oddsOfUniqueId = 0.75;
    const oddsOfSameId = 1 - oddsOfUniqueId;

    const countOfSameId = this.countsByFingerprint[check.fingerprint];
    const pctWithSameId = countOfSameId / profileCountOverTime;

    if (pctWithSameId > oddsOfSameId) {
      const botScore = ((pctWithSameId - oddsOfSameId) / oddsOfUniqueId) * 100;
      humanScore = 100 - botScore;
    }

    return humanScore;
  }
}
