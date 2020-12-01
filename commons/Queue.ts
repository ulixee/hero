import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from './utils';

type Callback<T> = (value?: any) => Promise<T>;

export default class Queue {
  private queue: { promise: IResolvablePromise; cb: Callback<any>; startStack: string }[] = [];
  private active = false;

  public run<T>(cb: Callback<T>): Promise<T> {
    const promise = createPromise<T>();

    this.queue.push({
      promise,
      cb,
      startStack: new Error('').stack
        .split('\n')
        .slice(1)
        .join('\n'),
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
    if (this.active) return;

    const next = this.queue.shift();
    if (!next) return;

    this.active = true;
    try {
      const res = await next.cb();
      next.promise.resolve(res);
    } catch (error) {
      error.stack = `${error.stack}\n-----QUEUE-----\n${next.startStack}`;
      next.promise.reject(error);
    } finally {
      this.active = false;
    }
    setImmediate(() => this.next());
  }
}
