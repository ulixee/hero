import * as net from 'net';
import IResolvablePromise from '../interfaces/IResolvablePromise';
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

export function toUrl(hostOrUrlFragment: string, defaultProtocol = 'ws:'): URL {
  if (!hostOrUrlFragment) return null;

  defaultProtocol = defaultProtocol.replaceAll('/', '');
  if (!hostOrUrlFragment.includes('://')) {
    hostOrUrlFragment = `${defaultProtocol}//${hostOrUrlFragment}`;
  }
  return new URL(hostOrUrlFragment);
}

export async function isPortInUse(port: number | string): Promise<boolean> {
  if (await isPortInUseOnHost(port, 'localhost')) return true;
  return await isPortInUseOnHost(port, '::');
}

export function isPortInUseOnHost(port: number | string, host = 'localhost'): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const server = net.createServer();

    server.once('error', err => {
      if ((err as any).code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        reject(err);
      }
      cleanup();
    });

    server.once('listening', () => {
      resolve(false);
      cleanup();
    });

    const cleanup = (): void => {
      server.removeAllListeners();
      server.unref();
      server.close();
    };

    server.listen(Number(port), host);
  });
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

function isClass(func: any): boolean {
  // Class constructor is also a function
  if (!(func && func.constructor === Function) || func.prototype === undefined) return false;

  // This is a class that extends other class
  if (Function.prototype !== Object.getPrototypeOf(func)) return true;

  // Usually a function will only have 'constructor' in the prototype
  return Object.getOwnPropertyNames(func.prototype).length > 1;
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
      descriptor.writable &&
      !Object.prototype[key] &&
      !Object[key] &&
      !isClass(descriptor.value)
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
