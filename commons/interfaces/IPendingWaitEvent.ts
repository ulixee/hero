import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';

export class CanceledPromiseError extends Error {}

export default interface IPendingWaitEvent {
  id: number;
  event: string | symbol;
  resolvable: IResolvablePromise;
  error: CanceledPromiseError;
}
