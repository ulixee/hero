import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class SymbolCheck extends BaseCheck {
  public readonly prefix = 'SYMB';
  public readonly type = CheckType.Individual;

  private readonly value: string;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string) {
    super(identity, meta);
    this.value = value;
  }

  public get signature() {
    return `${this.id}:${this.value}`;
  }

  public get args() {
    return [this.value];
  }
}
