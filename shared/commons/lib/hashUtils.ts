import { createHash } from 'crypto';
import { bech32m } from 'bech32';
import TypeSerializer from './TypeSerializer';

export function sha3(data: Buffer | string): Buffer {
  return createHash('sha3-256').update(data).digest();
}

export function encodeHash(digest: Buffer, prefix: 'scr' | 'dbx' | 'ar'): string {
  const words = bech32m.toWords(digest);
  return bech32m.encode(prefix, words, 256);
}

export function decodeHash(hash: string, expectedPrefix: 'scr' | 'dbx' | 'ar'): Buffer {
  const { prefix, words } = bech32m.decode(hash, 256);
  if (prefix !== expectedPrefix) {
    throw new Error(
      `The encoded hash had a different prefix (${prefix}) than expected (${expectedPrefix}).`,
    );
  }
  return Buffer.from(bech32m.fromWords(words));
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

  let buffer = Buffer.from(json);
  if (options?.prefix) buffer = Buffer.concat([options.prefix, buffer]);

  return createHash('sha3-256').update(buffer).digest();
}
