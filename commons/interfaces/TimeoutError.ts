import { registerSerializableErrorType } from '../TypeSerializer';

export default class TimeoutError extends Error {
  constructor(message?: string) {
    super(message ?? 'Timeout waiting for promise');
    this.name = 'TimeoutError';
  }
}

registerSerializableErrorType(TimeoutError);
