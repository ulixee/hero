import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

type IData = { hasFunction: boolean } | { constructorException: string };

export default class ClassCheck extends BaseCheck {
  public readonly prefix = 'CLSS';
  public readonly type = CheckType.Individual;

  private readonly data: IData;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, data: IData) {
    super(identity, meta);
    this.data = data;
  }

  public get signature() {
    const [key] = Object.keys(this.data);
    return `${this.id}:${key}=${this.data[key]}`;
  }

  public get args() {
    return [this.data];
  }
}
