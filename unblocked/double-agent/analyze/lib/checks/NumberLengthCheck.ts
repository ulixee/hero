import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

export default class NumberLengthCheck extends BaseCheck {
  public readonly prefix = 'NUML';
  public readonly type = CheckType.Individual;

  private readonly length: number;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, length: number) {
    super(identity, meta);
    this.length = length;
  }

  public get signature(): string {
    return `${this.id}:${this.length}`;
  }

  public get args(): any[] {
    return [this.length];
  }
}
