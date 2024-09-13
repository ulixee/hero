import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

export default class StringArrayCheck extends BaseCheck {
  public readonly prefix: string = 'STRA';
  public readonly type = CheckType.Individual;

  protected readonly value: string;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string) {
    super(identity, meta);
    this.value = value;
  }

  public get signature(): string {
    return `${this.id}:${this.value}`;
  }

  public get args(): any[] {
    return [this.value];
  }
}
