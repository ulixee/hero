// eslint-disable-next-line max-classes-per-file
import addGlobalInstance from './addGlobalInstance';
import { registerSerializableErrorType } from './TypeSerializer';

class UlixeeError extends Error {
  constructor(
    override message,
    public code,
    public data?: object,
  ) {
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

/**
 * When this error is thrown it means an operation was aborted,
 * usually in response to the `abort` event being emitted by an
 * AbortSignal.
 */
class AbortError extends Error {
  public static readonly code = 'ABORT_ERR';

  public readonly code: string;

  constructor(message = 'The operation was aborted') {
    super(message);
    this.code = AbortError.code;
  }

  public override toString(): string {
    return `${this.message} [${this.code}]`;
  }
}

class CodeError<T extends Record<string, any> = Record<string, never>> extends Error {
  public readonly props: T;

  constructor(
    message: string,
    public readonly code: string,
    props?: T,
  ) {
    super(message);

    this.name = props?.name ?? 'CodeError';
    this.props = props ?? ({} as T);
  }

  public override toString(): string {
    const extras = this.props ? `\n${JSON.stringify(this.props, null, 2)}` : '';
    return `${this.message} [${this.code}] ${extras}`;
  }
}

registerSerializableErrorType(CodeError);
registerSerializableErrorType(UlixeeError);
registerSerializableErrorType(AbortError);
addGlobalInstance(UlixeeError, CodeError);

export { UlixeeError, CodeError, AbortError };
