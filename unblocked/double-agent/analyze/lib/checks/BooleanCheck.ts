import BaseCheck, { ICheckIdentity, CheckType, ICheckMeta } from './BaseCheck';

export default class BooleanCheck extends BaseCheck {
  public readonly prefix = 'BOOL';
  public readonly type = CheckType.Individual;

  private readonly value: boolean;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, value: boolean) {
    super(identity, meta);
    this.value = value;
  }

  public get signature(): string {
    return `${this.id}:value=${this.value}`;
  }

  public get args(): any[] {
    return [this.value];
  }
}
