export default class ValidationError extends Error {
  constructor(readonly code: string, readonly errors: string[]) {
    super('Invalid request');
    this.code = 'invalid::parameters';
    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): unknown {
    return {
      ...this,
    };
  }

  public override toString(): string {
    const extras = this.errors ? `\n${this.errors.join('\n')}` : '';
    return `${this.message} [${this.code}] ${extras}`;
  }
}
