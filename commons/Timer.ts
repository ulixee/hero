import TimeoutError from './interfaces/TimeoutError';
import { createPromise } from './utils';

export default class Timer {
  public readonly [Symbol.toStringTag] = 'Timer';
  public readonly timeout: NodeJS.Timer;

  private readonly time = process.hrtime();
  private timeoutMessage = 'Timeout waiting';
  private readonly expirePromise = createPromise();

  constructor(readonly timeoutMillis: number, readonly registry?: IRegistry[]) {
    this.timeout = setTimeout(this.expire.bind(this), timeoutMillis).unref();
    if (registry) {
      registry.push({ reject: this.expirePromise.reject, timeout: this.timeout });
    }
  }

  public setMessage(message: string): void {
    this.timeoutMessage = message;
  }

  public clear(): void {
    if (this.registry) {
      const idx = this.registry.findIndex(x => x.timeout === this.timeout);
      if (idx >= 0) this.registry.splice(idx, 1);
    }
    clearTimeout(this.timeout);
  }

  public throwIfExpired(message?: string): void {
    if (this.isExpired()) {
      this.clear();
      throw new TimeoutError(message ?? this.timeoutMessage);
    }
  }

  public isExpired(): boolean {
    return this.elapsedMillis() > this.timeoutMillis;
  }

  public isResolved(): boolean {
    return this.expirePromise.isResolved;
  }

  public elapsedMillis(): number {
    const time = process.hrtime(this.time);
    return time[0] * 1000 + time[1] / 1000000;
  }

  public waitForPromise<Z>(promise: Promise<Z>, message: string): Promise<Z> {
    this.timeoutMessage = message;
    return Promise.race([promise, this.expirePromise]) as Promise<Z>;
  }

  public waitForTimeout(): Promise<void> {
    // wait for promise to expire
    return this.expirePromise.promise.catch(() => {});
  }

  private expire(): void {
    this.expirePromise.reject(new TimeoutError(this.timeoutMessage));
    this.clear();
  }

  public static expireAll(registry: IRegistry[], error: Error): void {
    // clear any pending timeouts
    while (registry.length) {
      const next = registry.shift();
      if (next) {
        const { timeout, reject } = next;
        clearTimeout(timeout);
        reject(error);
      }
    }
  }
}

interface IRegistry {
  timeout: NodeJS.Timer;
  reject: (err: Error) => any;
}
