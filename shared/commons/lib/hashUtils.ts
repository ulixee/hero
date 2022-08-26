import { createHash } from 'crypto';
import TypeSerializer from './TypeSerializer';

export const hashMessagePrefix = '\x18Ulixee Signed Message:\n';

export function sha3(data: Buffer | string): Buffer {
  return createHash('sha3-256').update(data).digest();
}

export function sortedJsonStringify<T>(obj: T | null, ignoreProperties: (keyof T)[] = []): string {
  if (!obj) {
    return '{}';
  }
  if (Array.isArray(obj) && !obj.length) {
    return '[]';
  }
  return TypeSerializer.stringify(obj, { ignoreProperties, sortKeys: true });
}

export function hashObject<T>(
  obj: T,
  options?: { prefix?: Buffer; ignoreProperties?: (keyof T)[] },
): Buffer {
  // sort keys for consistent hash
  const json = sortedJsonStringify(obj, options?.ignoreProperties);

  let buffer = Buffer.from(`${hashMessagePrefix}${json.length}${json}`);
  if (options?.prefix) buffer = Buffer.concat([options.prefix, buffer]);

  return createHash('sha3-256').update(buffer).digest();
}
