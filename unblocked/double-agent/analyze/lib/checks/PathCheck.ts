import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';

export default class PathCheck extends BaseCheck {
  public readonly prefix = 'PATH';
  public readonly type = CheckType.Individual;

  public constructor(identity: ICheckIdentity, meta: ICheckMeta) {
    super(identity, meta);
  }

  public get signature(): string {
    return `${this.meta}:${this.constructor.name}`;
  }

  public get args(): any[] {
    return [];
  }
}
