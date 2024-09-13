import { registerSerializableErrorType } from '../lib/TypeSerializer';
import addGlobalInstance from '../lib/addGlobalInstance';

export default class TimeoutError extends Error {
  constructor(message?: string) {
    super(message ?? 'Timeout waiting for promise');
    this.name = 'TimeoutError';
  }
}

addGlobalInstance(TimeoutError);
registerSerializableErrorType(TimeoutError);
