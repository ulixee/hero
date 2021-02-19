import { CanceledPromiseError } from './interfaces/IPendingWaitEvent';

export default class SessionClosedOrMissingError extends CanceledPromiseError {
  constructor(message: string) {
    super(message);
    this.name = 'SessionClosedOrMissingError';
  }
}
