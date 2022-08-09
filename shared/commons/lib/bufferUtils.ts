import { bech32m } from 'bech32';
import * as zlib from 'zlib';
import { promisify } from 'util';

const inflateAsync = promisify<Buffer, Buffer>(zlib.inflate);
const inflateRawAsync = promisify<Buffer, Buffer>(zlib.inflateRaw);
const brotliDecompressAsync = promisify<Buffer, Buffer>(zlib.brotliDecompress);
const gunzipAsync = promisify<Buffer, zlib.ZlibOptions, Buffer>(zlib.gunzip);

export function concatAsBuffer(...items: (string | number | Buffer)[]): Buffer {
  return Buffer.concat(
    items.map(x => {
      if (Buffer.isBuffer(x)) return x;
      if (!x && x !== 0) {
        return Buffer.from('');
      }
      return Buffer.from(String(x));
    }),
  );
}

export function bufferReplacer(key: string, value: any): any {
  if (value && Buffer.isBuffer(value)) {
    return value.toString('hex');
  }
  return value;
}

export function encodeBuffer(digest: Buffer, prefix: string): string {
  const words = bech32m.toWords(digest);
  return bech32m.encode(prefix, words, 256);
}

export function decodeBuffer(encoded: string, expectedPrefix: string): Buffer {
  const { prefix, words } = bech32m.decode(encoded, 256);
  if (prefix !== expectedPrefix) {
    throw new Error(
      `The encoded hash had a different prefix (${prefix}) than expected (${expectedPrefix}).`,
    );
  }
  return Buffer.from(bech32m.fromWords(words));
}

export function decompressBuffer(buffer: Buffer, encoding: string): Promise<Buffer> {
  if (!buffer || !encoding) return Promise.resolve(buffer);

  if (encoding === 'gzip' || encoding === 'x-gzip') {
    // from node-fetch:
    // Be less strict when decoding compressed responses, since sometimes
    // servers send slightly invalid responses that are still accepted
    // by common browsers.
    const zlibOptions = {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
    };
    return gunzipAsync(buffer, zlibOptions);
  }
  if (encoding === 'deflate' || encoding === 'x-deflate') {
    if ((buffer[0] & 0x0f) === 0x08) {
      return inflateAsync(buffer);
    }
    return inflateRawAsync(buffer);
  }
  if (encoding === 'br') {
    return brotliDecompressAsync(buffer);
  }

  return Promise.resolve(buffer);
}
