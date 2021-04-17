import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from './utils';
import { CanceledPromiseError } from './interfaces/IPendingWaitEvent';
import Resolvable from './Resolvable';
import getPrototypeOf = Reflect.getPrototypeOf;

type AsyncCallback<T> = (value?: any) => Promise<T>;

export default class Queue {
  public concurrency = 1;
  public idletimeMillis = 500;
  public idlePromise = createPromise();

  private readonly abortPromise = new Resolvable<CanceledPromiseError>();
  private idleTimout: NodeJS.Timeout;
  private activeCount = 0;

  private stopDequeuing = false;

  private queue: IQueueEntry[] = [];

  constructor(readonly stacktraceMarker = 'QUEUE', concurrency?: number) {
    if (concurrency) this.concurrency = concurrency;
  }

  public run<T>(cb: AsyncCallback<T>, timeoutMillis?: number): Promise<T> {
    const promise = createPromise<T>(timeoutMillis);

    this.queue.push({
      promise,
      cb,
      startStack: new Error('').stack.slice(8), // "Error: \n" is 8 chars
    });

    this.next().catch(() => null);
    return promise.promise;
  }

  public willStop(): void {
    this.stopDequeuing = true;
  }

  public stop(error?: CanceledPromiseError): void {
    const canceledError = error ?? new CanceledPromiseError('Canceling Queue Item');
    this.abortPromise.resolve(canceledError);
    while (this.queue.length) {
      const next = this.queue.shift();
      if (!next) continue;

      this.reject(next, canceledError);
    }
  }

  public canRunMoreConcurrently(): boolean {
    return this.activeCount < this.concurrency;
  }

  private async next(): Promise<void> {
    clearTimeout(this.idleTimout);

    if (!this.canRunMoreConcurrently() || this.stopDequeuing === true) return;

    const next = this.queue.shift();
    if (!next) {
      if (this.activeCount === 0) {
        this.idleTimout = setTimeout(() => this.idlePromise.resolve(), this.idletimeMillis).unref();
      }
      return;
    }

    if (this.activeCount === 0 && this.idlePromise.isResolved) {
      const newPromise = createPromise();
      this.idlePromise?.resolve(newPromise.promise);
      this.idlePromise = newPromise;
    }

    this.activeCount += 1;
    try {
      const res = await Promise.race([next.cb(), this.abortPromise.promise]);
      if (this.abortPromise.isResolved) {
        return this.reject(next, await this.abortPromise.promise);
      }

      next.promise.resolve(res);
    } catch (error) {
      this.reject(next, error);
    } finally {
      this.activeCount -= 1;
    }

    setImmediate(() => this.next().catch(() => null));
  }

  private reject(entry: IQueueEntry, sourceError: Error): void {
    const error = <Error>Object.create(getPrototypeOf(sourceError));
    error.message = sourceError.message;
    Object.assign(error, sourceError);

    const marker = `------${this.stacktraceMarker}`.padEnd(50, '-');
    error.stack = `${sourceError.stack}\n${marker}\n${entry.startStack}`;
    entry.promise.reject(error);
  }
}

interface IQueueEntry {
  promise: IResolvablePromise;
  cb: AsyncCallback<any>;
  startStack: string;
}
