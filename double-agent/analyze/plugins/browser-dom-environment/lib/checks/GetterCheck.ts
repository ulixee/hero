import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

type IData = { codeString: string } | { codeStringToString: string } | { accessException: string };

export default class GetterCheck extends BaseCheck {
  public readonly prefix = 'GETR';
  public readonly type = CheckType.Individual;

  private readonly data: IData;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, data: IData) {
    super(identity, meta);
    this.data = data;
  }

  public get signature(): string {
    const [key] = Object.keys(this.data);
    return `${this.id}:${key}=${this.data[key]}`;
  }

  public get args(): any[] {
    return [this.data];
  }
}
