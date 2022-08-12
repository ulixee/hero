export default class RemoteError extends Error {
  private readonly type: string;
  private readonly code: string;
  private readonly description: string;
  private readonly data: object;

  constructor(
    error: Partial<Error> & {
      type?: string;
      code?: string;
      description?: string;
      data?: any;
    },
  ) {
    const { type, code, description, stack, data } = error;
    const message = `Remote threw error (${type ?? error.name ?? code}): ${
      description ?? error.message
    }`;
    super(message);
    this.type = type;
    this.code = code;
    this.description = description;
    this.stack = stack ?? this.stack;
    this.data = data;
  }

  public override toString(): string {
    const extras = this.data ? `\n${JSON.stringify(this.data, null, 2)}` : '';
    const codeMessage = this.code ? `[${this.code}] ` : '';
    return `${this.message}: ${codeMessage}${extras}`;
  }
}
