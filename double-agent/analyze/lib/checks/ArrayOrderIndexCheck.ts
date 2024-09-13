import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

type IOrderIndex = [prevOrder: string[], postOrder: string[]];

export default class ArrayOrderIndexCheck extends BaseCheck {
  public readonly prefix = 'AORD';
  public readonly type = CheckType.Individual;

  private readonly orderIndex: IOrderIndex;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, orderIndex: IOrderIndex) {
    super(identity, meta);
    this.orderIndex = orderIndex;
  }

  public get signature(): string {
    const index = this.orderIndex.map(i => i.join(',')).join(';');
    return `${this.id}:${index}`;
  }

  public get args(): any[] {
    return [this.orderIndex];
  }
}
