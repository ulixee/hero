import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

export default class DefaultValueCheck extends BaseCheck {
  public readonly prefix = 'DVAL';
  public readonly type = CheckType.Individual;

  private readonly value: string[];

  constructor(identity: ICheckIdentity, meta: ICheckMeta, value: string[]) {
    super(identity, meta);
    this.value = value.sort();
  }

  public get signature(): string {
    return `${this.id}:${this.value.join('&')}`;
  }

  public get args(): any[] {
    return [this.value];
  }
}
