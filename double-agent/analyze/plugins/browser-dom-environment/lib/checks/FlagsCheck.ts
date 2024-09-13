import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class FlagsCheck extends BaseCheck {
  public readonly prefix = 'FLAG';
  public readonly type = CheckType.Individual;

  private readonly flags: string[];

  constructor(identity: ICheckIdentity, meta: ICheckMeta, flags: string[]) {
    super(identity, meta);
    this.flags = (flags ?? []).sort();
  }

  public get signature() {
    return `${this.id}:${this.flags.join('')}`;
  }

  public get args() {
    return [this.flags];
  }
}
