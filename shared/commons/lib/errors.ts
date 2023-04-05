// eslint-disable-next-line max-classes-per-file
import addGlobalInstance from './addGlobalInstance';

class UlixeeError extends Error {
  constructor(override message, public code, public data?: object) {
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
  constructor(public status, json) {
    super(json.message || 'Unexpected error', json.code, json);
  }
}

addGlobalInstance(UlixeeError, APIError);

export { APIError, UlixeeError };
