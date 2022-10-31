import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class ExpectedValueCheck extends BaseCheck {
  public readonly prefix = 'EVLS';
  public readonly type = CheckType.Individual;

  private readonly expectedValues: (string | number)[];
  private readonly value: string | number;

  constructor(
    identity: ICheckIdentity,
    meta: ICheckMeta,
    expectedValues: (string | number)[],
    value: string | number,
  ) {
    super(identity, meta);
    this.expectedValues = expectedValues;
    this.value = value;
  }

  public get signature() {
    return `${this.id}:${this.expectedValues.join(',')}`;
  }

  public get args() {
    return [this.expectedValues, this.value];
  }

  public override generateHumanScore(check: ExpectedValueCheck | null): number {
    super.generateHumanScore(check);
    return 100;
  }
}
