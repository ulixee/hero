import IResolvablePromise from '@secret-agent/interfaces/IResolvablePromise';
import Resolvable from './Resolvable';

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
  return new Resolvable<T>(timeoutMillis, timeoutMessage);
}
