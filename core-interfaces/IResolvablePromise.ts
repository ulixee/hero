export default interface IResolvablePromise<T = any> {
  isResolved: boolean;
  stack?: string;
  promise?: Promise<T>;
  resolve?: (value?: T | PromiseLike<T>) => void;
  reject?: (reason?: any) => void;
  timeout?: NodeJS.Timeout;
}
