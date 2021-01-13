import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';

export function assert(value: unknown, message?: string, reject?): void {
  if (value) return;
  const error = new Error(message);
  if (reject) {
    reject(error);
  } else {
    throw error;
  }
}

export function pickRandom<T>(array: T[]): T {
  if (!array.length) throw new Error('Empty array provided to "pickRandom"');
  return array[Math.floor(Math.random() * array.length)];
}

export function bindFunctions(self: any): void {
  let object = self;
  do {
    for (const key of Reflect.ownKeys(object)) {
      if (key === 'constructor') {
        continue;
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
      if (descriptor && typeof descriptor.value === 'function') {
        self[key] = self[key].bind(self);
      }
    }
    object = Reflect.getPrototypeOf(object);
  } while (object && object !== Object.prototype);
}

export function createPromise<T = any>(
  timeoutMillis?: number,
  timeoutMessage?: string,
): IResolvablePromise<T> {
  const response: IResolvablePromise<T> = {
    isResolved: false,
  };
  // get parent stack
  const error = new Error(timeoutMessage || 'Timeout waiting for promise');
  response.stack = error.stack.split(/\r?\n/).slice(2).join('\n');

  response.promise = new Promise((resolve, reject) => {
    response.resolve = (...args) => {
      if (response.isResolved) return;
      response.isResolved = true;
      clearTimeout(response.timeout);
      resolve(...args);
    };
    response.reject = err => {
      if (response.isResolved) return;
      response.isResolved = true;
      clearTimeout(response.timeout);
      reject(err);
    };
    if (timeoutMillis !== undefined && timeoutMillis !== null) {
      response.timeout = setTimeout(() => response.reject(error), timeoutMillis).unref();
    }
  });
  // bind `then` and `catch` to implement the same interface as Promise
  (response as any).then = response.promise.then.bind(response.promise);
  (response as any).catch = response.promise.catch.bind(response.promise);
  return response;
}
