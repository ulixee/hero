import { ZodError } from 'zod';

export default class ValidationError extends Error {
  public readonly code = 'ERR_VALIDATION';
  constructor(message: string, readonly errors: string[]) {
    super(message ?? 'Invalid request');
    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): unknown {
    return {
      errors: this.errors,
      message: this.message,
      code: this.code,
      stack: this.stack,
    };
  }

  public override toString(): string {
    const errors = this.errors ? `\n${this.errors.join('\n - ')}` : '';
    return `${this.message}${errors}`;
  }

  static fromZodValidation(message: string, error: ZodError): ValidationError {
    const errorList = error.issues.map(x => `"${x.path.join('.')}": ${x.message}`);
    throw new ValidationError(message, errorList);
  }
}
