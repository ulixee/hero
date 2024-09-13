import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class StacktraceCheck extends BaseCheck {
  public readonly prefix = 'STCK';
  public readonly type = CheckType.Individual;

  private readonly errorClass: string;

  constructor(identity: ICheckIdentity, meta: ICheckMeta, stacktrace: string) {
    super(identity, meta);
    this.errorClass = stacktrace.split('\n').shift();
  }

  public get signature() {
    return `${this.id}:errorClass=${this.errorClass}`;
  }

  public get args() {
    return [this.errorClass];
  }
}
