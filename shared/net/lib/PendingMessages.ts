import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { createPromise } from '@ulixee/commons/lib/utils';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';

export default class PendingMessages<IPayload> {
  private lastId = 0;
  private readonly pendingRequestsById = new Map<string, IResolvablePromise<IPayload>>();
  private dontCancelIds = new Set<string>();

  constructor(private marker: string = `\n${'------CONNECTION'.padEnd(50, '-')}\n`) {}

  public cancel(error: CanceledPromiseError): void {
    for (const id of this.pendingRequestsById.keys()) {
      if (this.dontCancelIds.has(id)) {
        continue;
      }
      this.reject(id, error);
    }
  }

  public resolve(id: string, data: IPayload): void {
    this.pendingRequestsById.get(id)?.resolve(data);
    this.pendingRequestsById.delete(id);
  }

  public reject(id: string, error: Error): void {
    const entry = this.pendingRequestsById.get(id);
    if (!entry) return;

    this.pendingRequestsById.delete(id);

    if (!error.stack.includes(this.marker)) {
      error.stack += `${this.marker}${entry.stack}`;
    }
    entry.reject(error);
  }

  public delete(id: string): void {
    this.pendingRequestsById.get(id)?.resolve();
    this.pendingRequestsById.delete(id);
  }

  public create(
    timeoutMs: number,
    dontCancelId = false,
  ): { id: string; promise: Promise<IPayload> } {
    const resolvablePromise = createPromise<IPayload>(timeoutMs);
    this.lastId += 1;
    const id = this.lastId.toString();
    if (dontCancelId) {
      this.dontCancelIds.add(id);
    }
    this.pendingRequestsById.set(id, resolvablePromise);
    return { id, promise: resolvablePromise.promise };
  }
}
