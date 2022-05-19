import * as zlib from 'zlib';
import { promisify } from 'util';

const inflateAsync = promisify<Buffer, Buffer>(zlib.inflate);
const inflateRawAsync = promisify<Buffer, Buffer>(zlib.inflateRaw);
const brotliDecompressAsync = promisify<Buffer, Buffer>(zlib.brotliDecompress);
const gunzipAsync = promisify<Buffer, zlib.ZlibOptions, Buffer>(zlib.gunzip);

export default function decodeBuffer(buffer: Buffer, encoding: string): Promise<Buffer> {
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
