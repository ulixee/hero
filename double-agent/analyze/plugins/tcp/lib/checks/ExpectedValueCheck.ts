import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class ExpectedValueCheck extends BaseCheck {
  public readonly prefix = 'EVAL';
  public readonly type = CheckType.Individual;

  private readonly expectedValue: string | number;
  private readonly value: string | number;

  constructor(
    identity: ICheckIdentity,
    meta: ICheckMeta,
    expectedValue: string | number,
    value: string | number,
  ) {
    super(identity, meta);
    this.expectedValue = expectedValue;
    this.value = value;
  }

  public get signature() {
    return `${this.id}:${this.expectedValue}`;
  }

  public get args() {
    return [this.expectedValue, this.value];
  }

  public override generateHumanScore(check: ExpectedValueCheck | null): number {
    super.generateHumanScore(check);
    return 100;
  }
}
