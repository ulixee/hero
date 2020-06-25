import { createPromise, IResolvablePromise } from './utils';

type Callback<T> = (value?: any) => Promise<T>;

export default class Queue {
  private queue: { promise: IResolvablePromise; cb: Callback<any> }[] = [];
  private active = false;

  public run<T>(cb: Callback<T>) {
    const promise = createPromise<T>();

    this.queue.push({
      promise,
      cb,
    });
    setImmediate(() => this.next());
    return promise.promise;
  }

  public stop() {
    while (this.queue.length) {
      this.queue.pop().promise.reject();
    }
  }

  private async next() {
    if (this.active) return;

    const next = this.queue.shift();
    if (!next) return;

    this.active = true;
    try {
      const res = await next.cb();
      next.promise.resolve(res);
    } catch (error) {
      next.promise.reject(error);
    } finally {
      this.active = false;
    }
    setImmediate(() => this.next());
  }
}
