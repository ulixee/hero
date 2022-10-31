import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class SessionFingerprintCheck extends BaseCheck {
  public readonly prefix = 'SFNG';
  public readonly type = CheckType.Individual;

  private readonly fingerprints: string[];

  constructor(identity: ICheckIdentity, meta: ICheckMeta, fingerprints: string[]) {
    super(identity, meta);
    this.fingerprints = fingerprints;
  }

  public get signature() {
    return `${this.meta}:${this.constructor.name}`;
  }

  public get args() {
    return [this.fingerprints];
  }

  public override generateHumanScore(check: SessionFingerprintCheck | null): number {
    super.generateHumanScore(check);
    const allMatch = check.fingerprints.every(x => x === check.fingerprints[0]);
    return allMatch ? 100 : 0;
  }
}
