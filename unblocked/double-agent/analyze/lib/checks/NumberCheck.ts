import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

export default class NumberCheck extends BaseCheck {
  public readonly prefix = 'NUMR';
  public readonly type = CheckType.Individual;

  private readonly value: number;
  private readonly label: string;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, value: number, label?: string) {
    super(identity, meta);
    this.value = value;
    this.label = label;
  }

  public get signature(): string {
    return `${this.id}:${this.value}`;
  }

  public get args(): any[] {
    return [this.value, this.label];
  }
}
