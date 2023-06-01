import { CanceledPromiseError } from '../interfaces/IPendingWaitEvent';
import IResolvablePromise from '../interfaces/IResolvablePromise';
import { CodeError } from './errors';
import Resolvable from './Resolvable';
import TypedEventEmitter from './TypedEventEmitter';
import { createPromise } from './utils';
import getPrototypeOf = Reflect.getPrototypeOf;

type AsyncCallback<T> = (value?: any) => Promise<T>;

export default class Queue<TResult = any> extends TypedEventEmitter<{
  completed: TResult;
  error: Error;
  idle: void;
  stopped: { error?: Error };
}> {
  public concurrency = 1;
  public idletimeMillis = 500;
  public idlePromise = createPromise();
  public get isActive(): boolean {
    return (this.activeCount > 0 || this.queue.length > 0) && !this.stopDequeuing;
  }

  public get size(): number {
    return this.queue.length;
  }

  public activeCount = 0;

  private abortPromise = new Resolvable<CanceledPromiseError>();
  private idleTimout: NodeJS.Timeout;

  private stopDequeuing = false;

  private queue: IQueueEntry[] = [];

  constructor(
    readonly stacktraceMarker = 'QUEUE',
    concurrency?: number,
    abortSignal?: AbortSignal,
  ) {
    super();
    if (concurrency) this.concurrency = concurrency;
    if (abortSignal) {
      // clear the queue and throw if the query is aborted
      abortSignal.addEventListener('abort', () => {
        this.stop(new CodeError('Query aborted', 'ERR_QUERY_ABORTED'));
      });
    }
    void this.idlePromise.then(() => this.emit('idle'));
  }

  public run<T>(
    cb: AsyncCallback<T>,
    options?: { timeoutMillis?: number; priority?: number | bigint },
  ): Promise<T> {
    const priority = BigInt(options?.priority ?? 0);
    const promise = createPromise<T>(options?.timeoutMillis);
    const entry: IQueueEntry = {
      promise,
      cb,
      priority,
      startStack: new Error('').stack.slice(8), // "Error: \n" is 8 chars
    };
    if (!this.queue.length || this.queue[this.queue.length - 1].priority >= priority) {
      this.queue.push(entry);
    } else {
      const index = this.getInsertionIndex(priority);
      this.queue.splice(index, 0, entry);
    }

    this.next().catch(() => null);
    return promise.promise;
  }

  public reset(): void {
    this.stop();
    this.abortPromise = new Resolvable();
    this.stopDequeuing = false;
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

      // catch unhandled rejections here
      // eslint-disable-next-line promise/no-promise-in-callback
      next.promise.promise.catch(() => null);
      this.reject(next, canceledError);
    }
    this.emit('stopped', { error });
  }

  public canRunMoreConcurrently(): boolean {
    return this.activeCount < this.concurrency;
  }

  public async *toGenerator(
    events?: TypedEventEmitter<{ cleanup: void }>,
  ): AsyncGenerator<TResult, void, undefined> {
    let resolvable = new Resolvable<void>();
    let running = true;
    const results: TResult[] = [];

    const cleanup = (): void => {
      if (!running) return;

      running = false;
      this.stop();
      results.length = 0;
    };

    this.on('completed', result => {
      results.push(result);
      resolvable.resolve();
    });
    this.on('error', err => {
      cleanup();
      resolvable.reject(err);
    });
    this.on('idle', () => {
      running = false;
      resolvable.resolve();
    });
    this.on('stopped', ({ error }) => {
      running = false;
      if (error) resolvable.reject(error);
      else resolvable.resolve();
    });

    // the user broke out of the loop early, ensure we resolve the resolvable result
    // promise and clear the queue of any remaining jobs
    events?.on('cleanup', () => {
      cleanup();
      resolvable.resolve();
    });

    while (running) {
      await resolvable.promise;
      resolvable = new Resolvable<void>();

      // yield all available results
      while (results.length > 0) {
        const result = results.shift();

        if (result != null) {
          yield result;
        }
      }
    }

    // yield any remaining results
    yield* results;
    cleanup();
  }

  private async next(): Promise<void> {
    clearTimeout(this.idleTimout);

    if (!this.canRunMoreConcurrently()) return;
    if (this.stopDequeuing) return;

    const next = this.queue.shift();
    if (!next) {
      if (this.activeCount === 0) {
        this.idleTimout = setTimeout(() => this.idlePromise.resolve(), this.idletimeMillis) as any;
        this.idleTimout.unref();
      }
      return;
    }

    if (this.activeCount === 0 && this.idlePromise.isResolved) {
      const newPromise = createPromise();
      this.idlePromise?.resolve(newPromise.promise);
      this.idlePromise = newPromise;
      void newPromise.then(() => this.emit('idle'));
    }

    this.activeCount += 1;
    try {
      const res = await Promise.race([next.cb(), this.abortPromise.promise]);
      if (this.abortPromise.isResolved) {
        return this.reject(next, await this.abortPromise.promise);
      }

      next.promise.resolve(res);
      this.emit('completed', res);
    } catch (error) {
      this.emit('error', error);
      this.reject(next, error);
    } finally {
      this.activeCount -= 1;
    }

    process.nextTick(() => this.next().catch(() => null));
  }

  private reject(entry: IQueueEntry, sourceError: Error): void {
    const error = <Error>Object.create(getPrototypeOf(sourceError));
    error.message = sourceError.message;
    Object.assign(error, sourceError);

    const marker = `------${this.stacktraceMarker}`.padEnd(50, '-');
    error.stack = `${sourceError.stack}\n${marker}\n  ${entry.startStack}`;
    entry.promise.reject(error);
  }

  private getInsertionIndex(priority: bigint): number {
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      const entry = this.queue[i];
      if (entry.priority > priority) return i;
    }
  }
}

interface IQueueEntry {
  promise: IResolvablePromise;
  cb: AsyncCallback<any>;
  startStack: string;
  priority: bigint;
}
