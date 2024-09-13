import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

export default class DecimalLengthCheck extends BaseCheck {
  public readonly prefix = 'DECL';
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
