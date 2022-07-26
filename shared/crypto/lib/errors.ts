// eslint-disable-next-line max-classes-per-file
import { UlixeeError } from '@ulixee/commons/lib/errors';

export class InvalidSignatureError extends UlixeeError {
  constructor(message, readonly details = {}) {
    super(message, 'ERR_SIGNATURE_INVALID', { details });
  }
}

export class UnreadableKeysError extends UlixeeError {
  constructor(message) {
    super(message, 'ERR_KEY_UNREADABLE');
  }
}

export class InvalidKeypairError extends UlixeeError {
  constructor(message) {
    super(message, 'ERR_KEY_INVALID');
  }
}
