import { CanceledPromiseError } from '../interfaces/IPendingWaitEvent';
import { registerSerializableErrorType } from './TypeSerializer';

export default class SessionClosedOrMissingError extends CanceledPromiseError {
  constructor(message: string) {
    super(message);
    this.name = 'SessionClosedOrMissingError';
  }
}

registerSerializableErrorType(SessionClosedOrMissingError);
