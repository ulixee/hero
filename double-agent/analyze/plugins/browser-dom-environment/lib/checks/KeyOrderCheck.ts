import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class KeyOrderCheck extends BaseCheck {
  public readonly prefix = 'KORD';
  public readonly type = CheckType.Individual;

  private readonly keys: string[];

  constructor(identity: ICheckIdentity, meta: ICheckMeta, keys: string[]) {
    super(identity, meta);
    this.keys = keys;
  }

  public get signature() {
    return `${this.id}:${this.keys.join(',')}`;
  }

  public get args() {
    return [this.keys];
  }
}
