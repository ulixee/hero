import IResolvablePromise from '@ulixee/hero-interfaces/IResolvablePromise';
import { registerSerializableErrorType } from '../TypeSerializer';

export class CanceledPromiseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanceledPromiseError';
  }
}

export default interface IPendingWaitEvent {
  id: number;
  event: string | symbol;
  resolvable: IResolvablePromise;
  error: CanceledPromiseError;
}

registerSerializableErrorType(CanceledPromiseError);
