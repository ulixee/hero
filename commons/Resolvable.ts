import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { bindFunctions } from './utils';
import TimeoutError from './interfaces/TimeoutError';

export default class Resolvable<T = any> implements IResolvablePromise<T>, PromiseLike<T> {
  public isResolved = false;
  public resolved: T;
  public promise: Promise<T>;
  public readonly timeout: NodeJS.Timeout;
  public readonly stack: string;

  private resolveFn: (value: T | PromiseLike<T>) => void;
  private rejectFn: (error?: Error) => void;

  constructor(timeoutMillis?: number, timeoutMessage?: string) {
    // get parent stack
    const error = new TimeoutError(timeoutMessage);
    this.stack = error.stack.split(/\r?\n/).slice(2).join('\n');

    if (timeoutMillis !== undefined && timeoutMillis !== null) {
      this.timeout = setTimeout(this.reject.bind(this, error), timeoutMillis).unref();
    }
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveFn = resolve;
      this.rejectFn = reject;
    });
    bindFunctions(this);
  }

  public resolve(value: T | PromiseLike<T>): void {
    if (this.isResolved) return;
    this.isResolved = true;
    clearTimeout(this.timeout);
    this.resolveFn(value);
    Promise.resolve(value)
      // eslint-disable-next-line promise/always-return
      .then(x => {
        this.resolved = x;
      })
      .catch(() => null);
  }

  public reject(error: Error): void {
    if (this.isResolved) return;
    this.isResolved = true;
    clearTimeout(this.timeout);
    this.rejectFn(error);
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
}
