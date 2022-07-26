// eslint-disable-next-line max-classes-per-file
import { UlixeeError } from '@ulixee/commons/lib/errors';

export class InvalidSignatureError extends UlixeeError {
  constructor(message, readonly details = {}) {
    super(message, 'ERR_SIGNATURE_INVALID', { details });
  }
}

export class UnreadableIdentityError extends UlixeeError {
  constructor(message) {
    super(message, 'ERR_IDENTITY_UNREADABLE');
  }
}

export class InvalidIdentityError extends UlixeeError {
  constructor(message) {
    super(message, 'ERR_IDENTITY_INVALID');
  }
}
