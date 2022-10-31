import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class FunctionCheck extends BaseCheck {
  public readonly prefix = 'FUNC';
  public readonly type = CheckType.Individual;

  private readonly codeString: string;
  private readonly methods: { [name: string]: string };
  private readonly invocation: string;

  constructor(
    identity: ICheckIdentity,
    meta: ICheckMeta,
    codeString: string,
    methods: { [name: string]: string },
    invocation: string,
  ) {
    super(identity, meta);
    this.codeString = codeString;
    this.methods = methods;
    this.invocation = invocation;
  }

  public get signature() {
    const methods = Object.entries(this.methods)
      .map((name, value) => `${name}=${value}`)
      .join(';');
    return `${this.id}:codeString=${this.codeString};${methods};invocation=${this.invocation}`;
  }

  public get args() {
    return [this.codeString, this.methods, this.invocation];
  }
}
