import { createHash } from 'crypto';
import { bech32m } from 'bech32';
import TypeSerializer from './TypeSerializer';

export function sha3(data: Buffer | string): Buffer {
  return createHash('sha3-256').update(data).digest();
}

export function encodeHash(digest: Buffer, prefix: 'scr' | 'dbx'): string {
  const words = bech32m.toWords(digest);
  return bech32m.encode(prefix, words);
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

export function hashObject<T>(obj: T, ignoreProperties: (keyof T)[] = []): Buffer {
  // sort keys for consistent hash
  const json = sortedJsonStringify(obj, ignoreProperties);

  return createHash('sha3-256').update(Buffer.from(json)).digest();
}
