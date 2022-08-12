// eslint-disable-next-line max-classes-per-file
class UlixeeError extends Error {
  constructor(override readonly message, readonly code, protected data?: object) {
    // Calling parent constructor of base Error class.
    super(message);

    this.code = code;

    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): unknown {
    return {
      message: this.message,
      ...this,
    };
  }

  public override toString(): string {
    const extras = this.data ? `\n${JSON.stringify(this.data, null, 2)}` : '';
    return `${this.message} [${this.code}] ${extras}`;
  }
}

class APIError extends UlixeeError {
  constructor(readonly status, json) {
    super(json.message || 'Unexpected error', json.code, json);
  }
}

export { APIError, UlixeeError };
