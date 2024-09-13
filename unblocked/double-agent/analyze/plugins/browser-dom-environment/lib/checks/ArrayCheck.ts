import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class ArrayCheck extends BaseCheck {
  public readonly prefix = 'ARRY';
  public readonly type = CheckType.Individual;

  private readonly hasLengthProperty: boolean;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, hasLengthProperty: boolean) {
    super(identity, meta);
    this.hasLengthProperty = hasLengthProperty;
  }

  public get signature() {
    return `${this.id}:hasLengthProperty=${this.hasLengthProperty}`;
  }

  public get args() {
    return [this.hasLengthProperty];
  }
}
