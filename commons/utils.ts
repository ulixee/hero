import IResolvablePromise from '@secret-agent/interfaces/IResolvablePromise';
import Resolvable from './Resolvable';
import CallSite = NodeJS.CallSite;

export function assert(value: unknown, message?: string, reject?): void {
  if (value) return;
  const error = new Error(message);
  if (reject) {
    reject(error);
  } else {
    throw error;
  }
}

export function getCallSite(priorToFilename?: string, endFilename?: string): CallSite[] {
  const err = new Error();

  Error.prepareStackTrace = (_, stack) => stack;

  let stack = (err.stack as unknown) as CallSite[];

  Error.prepareStackTrace = undefined;
  let startIndex = 1;

  if (priorToFilename) {
    const idx = stack.findIndex(
      x => x.getFileName() === priorToFilename || x.getFileName()?.endsWith(priorToFilename),
    );
    if (idx >= 0) startIndex = idx + 1;
  }
  stack = stack.slice(startIndex);

  if (endFilename) {
    const lastIdx = stack.findIndex(
      x => x.getFileName() === endFilename || x.getFileName()?.endsWith(endFilename),
    );
    if (lastIdx >= 0) stack = stack.slice(0, lastIdx + 1);
  }
  return stack;
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
