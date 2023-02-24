import IResolvablePromise from '../interfaces/IResolvablePromise';
import TimeoutError from '../interfaces/TimeoutError';

let idCounter = 0;
export default class Resolvable<T = any> implements IResolvablePromise<T>, PromiseLike<T> {
  // eslint-disable-next-line no-multi-assign
  public id = (idCounter += 1);
  public isResolved = false;
  public resolved: T;
  public promise: Promise<T>;
  public readonly timeout: NodeJS.Timeout;
  public readonly stack: string;

  private resolveFn: (value: T | PromiseLike<T>) => void;
  private rejectFn: (error?: Error) => void;

  constructor(timeoutMillis?: number, timeoutMessage?: string) {
    // get parent stack
    this.stack = new Error('').stack.slice(8);
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveFn = resolve;
      this.rejectFn = reject;
    });

    if (timeoutMillis !== undefined && timeoutMillis !== null) {
      this.timeout = setTimeout(
        this.rejectWithTimeout.bind(this, timeoutMessage),
        timeoutMillis,
      ).unref();
    }
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
  }

  public resolve(value: T | PromiseLike<T>): void {
    if (this.isResolved) return;
    clearTimeout(this.timeout);
    this.resolveFn(value);
    this.isResolved = true;
    this.clean();
    if (value && typeof value === 'object' && 'then' in value && typeof value.then === 'function') {
      void Promise.resolve(value)
        // eslint-disable-next-line promise/always-return
        .then(x => {
          this.resolved = x;
        })
        .catch(this.reject);
    } else {
      this.resolved = value as T;
    }
  }

  public reject(error: Error, noUnhandledRejections = false): void {
    if (this.isResolved) return;
    this.isResolved = true;
    if (noUnhandledRejections) {
      // eslint-disable-next-line promise/no-promise-in-callback
      this.promise.catch(() => null);
    }
    this.rejectFn(error);
    this.clean();
  }

  public toJSON(): object {
    return {
      isResolved: this.isResolved,
      resolved: this.resolved,
    };
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?: (reason: any) => TResult | PromiseLike<TResult>,
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  public finally(onfinally?: () => void): Promise<T> {
    return this.promise.finally(onfinally);
  }

  private clean(): void {
    clearTimeout(this.timeout);
    this.resolveFn = null;
    this.rejectFn = null;
  }

  private rejectWithTimeout(message: string): void {
    const error = new TimeoutError(message);
    error.stack = `TimeoutError: ${message}\n${this.stack}`;
    this.reject(error, true);
  }
}
