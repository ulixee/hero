import * as net from 'net';
import { EventEmitter } from 'node:events';
import IResolvablePromise from '../interfaces/IResolvablePromise';
import Resolvable from './Resolvable';
import { TypedEventEmitter } from './eventUtils';

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

const prototypeFunctionMap = new Map<any, Set<PropertyKey>>();
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
      descriptor.writable &&
      !isClass(descriptor.value)
    ) {
      functionKeys.add(key);
    }
  }

  prototypeFunctionMap.set(object, functionKeys);
  return functionKeys;
}

const stoppingPoints = new Set([
  EventEmitter.prototype,
  Object.prototype,
  Object,
  Function.prototype,
  TypedEventEmitter,
]);

export function bindFunctions(self: any): void {
  let proto = Object.getPrototypeOf(self);
  const keys = new Set();
  while (proto && !stoppingPoints.has(proto)) {
    for (const key of getObjectFunctionProperties(proto)) {
      // ensure the last class to define the function is the one that gets bound
      if (keys.has(key)) continue;
      keys.add(key);
      self[key] = self[key].bind(self);
    }
    proto = Object.getPrototypeOf(proto);
  }
}

export function createPromise<T = any>(
  timeoutMillis?: number,
  timeoutMessage?: string,
): IResolvablePromise<T> {
  return new Resolvable<T>(timeoutMillis, timeoutMessage);
}
