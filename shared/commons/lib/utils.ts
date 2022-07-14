import IResolvablePromise from '../interfaces/IResolvablePromise';
import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
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

// @deprecated - change case... can't remove due to hero dependency
export function getCallSite(priorToFilename?: string, endFilename?: string): ISourceCodeLocation[] {
  return getCallsite(priorToFilename, endFilename);
}

export function getCallsite(priorToFilename?: string, endFilename?: string): ISourceCodeLocation[] {
  const startingPrepareStack = Error.prepareStackTrace;
  const startingTraceLimit = Error.stackTraceLimit;

  Error.stackTraceLimit = 25;
  Error.prepareStackTrace = (_, callsite): ISourceCodeLocation[] => {
    return callsite.map(x => ({
      filename: x.getFileName(),
      line: x.getLineNumber(),
      column: x.getColumnNumber() - 1,
    }));
  };

  const capture: { stack?: ISourceCodeLocation[] } = {};
  Error.captureStackTrace(capture);
  Error.stackTraceLimit = startingTraceLimit;
  let stack = capture.stack;

  Error.prepareStackTrace = startingPrepareStack;
  let startIndex = 1;

  if (priorToFilename) {
    const idx = stack.findIndex(
      x => x.filename === priorToFilename || x.filename?.endsWith(priorToFilename),
    );
    if (idx >= 0) startIndex = idx + 1;
  }
  stack = stack.slice(startIndex);

  if (endFilename) {
    let lastIdx = -1;
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const x = stack[i];
      if (x.filename === endFilename || x.filename?.endsWith(endFilename)) {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx >= 0) stack = stack.slice(0, lastIdx + 1);
  }
  return stack.filter(
    x =>
      !!x.filename && !x.filename.startsWith('internal') && !x.filename.startsWith('node:internal'),
  );
}

export function escapeUnescapedChar(str: string, char: string): string {
  let i = str.indexOf(char);
  while (i !== -1) {
    if (str[i - 1] !== '\\') {
      str = `${str.substr(0, i)}\\${str.substr(i)}`;
    }
    i = str.indexOf(char, i + 2);
  }
  return str;
}

export function pickRandom<T>(array: T[]): T {
  if (array.length === 1) return array[0];
  if (!array.length) throw new Error('Empty array provided to "pickRandom"');
  return array[Math.floor(Math.random() * array.length)];
}

const prototypeFunctionMap = new WeakMap<any, Set<PropertyKey>>();
export function getObjectFunctionProperties(object: any): Set<PropertyKey> {
  if (prototypeFunctionMap.has(object)) return prototypeFunctionMap.get(object);

  const functionKeys = new Set<PropertyKey>();
  for (const key of Reflect.ownKeys(object)) {
    if (key === 'constructor') {
      continue;
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
    if (
      descriptor &&
      typeof descriptor.value === 'function' &&
      !descriptor.get &&
      !descriptor.set &&
      descriptor.writable
    ) {
      functionKeys.add(key);
    }
  }

  prototypeFunctionMap.set(object, functionKeys);
  return functionKeys;
}

const prototypeHierarchyCache = new WeakMap<object, any[]>();
export function getPrototypeHierarchy(self: any): object[] {
  const hierarchy: object[] = [];
  let object = self;
  do {
    hierarchy.unshift(object);

    if (prototypeHierarchyCache.has(object)) {
      return prototypeHierarchyCache.get(object).concat(hierarchy);
    }

    object = Reflect.getPrototypeOf(object);
  } while (object && object !== Object.prototype);

  // don't put in the last item
  for (let i = 0; i < hierarchy.length - 1; i += 1) {
    const entry = hierarchy[i];
    const ancestors = i > 0 ? hierarchy.slice(0, i) : [];
    prototypeHierarchyCache.set(entry, ancestors);
  }

  return hierarchy;
}

export function bindFunctions(self: any): void {
  const hierarchy = getPrototypeHierarchy(self);
  for (const tier of hierarchy) {
    const keys = getObjectFunctionProperties(tier);
    for (const key of keys) {
      self[key] = self[key].bind(self);
    }
  }
}

export function createPromise<T = any>(
  timeoutMillis?: number,
  timeoutMessage?: string,
): IResolvablePromise<T> {
  return new Resolvable<T>(timeoutMillis, timeoutMessage);
}
