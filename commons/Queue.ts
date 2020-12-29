import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from './utils';

type Callback<T> = (value?: any) => Promise<T>;

export default class Queue {
  public concurrency = 1;
  public idletimeMillis = 500;
  public idlePromise = createPromise();

  private idleTimout: NodeJS.Timeout;
  private activeCount = 0;

  private queue: { promise: IResolvablePromise; cb: Callback<any>; startStack: string }[] = [];

  constructor(readonly stacktraceMarker = 'QUEUE') {}

  public run<T>(cb: Callback<T>, timeoutMillis?: number): Promise<T> {
    const promise = createPromise<T>(timeoutMillis);

    this.queue.push({
      promise,
      cb,
      startStack: new Error('').stack.split('\n').slice(1).join('\n'),
    });
    setImmediate(() => this.next());
    return promise.promise;
  }

  public stop(): void {
    while (this.queue.length) {
      this.queue.pop().promise.reject();
    }
  }

  private async next(): Promise<void> {
    clearTimeout(this.idleTimout);

    if (this.activeCount >= this.concurrency) return;

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
      const res = await next.cb();
      next.promise.resolve(res);
    } catch (error) {
      const marker = `------${this.stacktraceMarker}`.padEnd(50, '-');

      error.stack = `${error.stack}\n${marker}\n${next.startStack}`;
      next.promise.reject(error);
    } finally {
      this.activeCount -= 1;
    }

    setImmediate(() => this.next());
  }
}
