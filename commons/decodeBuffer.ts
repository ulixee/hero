import zlib from 'zlib';
import { createPromise } from './utils';

export default async function decodeBuffer(buffer: Buffer, encoding: string): Promise<Buffer> {
  if (!buffer) return null;
  if (!encoding) return buffer;

  const promise = createPromise<Buffer>();
  const handler = (error, result) => {
    if (error) promise.reject(error);
    else promise.resolve(result);
  };

  if (encoding === 'gzip' || encoding === 'x-gzip') {
    // from node-fetch:
    // Be less strict when decoding compressed responses, since sometimes
    // servers send slightly invalid responses that are still accepted
    // by common browsers.
    const zlibOptions = {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
    };
    zlib.gunzip(buffer, zlibOptions, handler);
  } else if (encoding === 'deflate' || encoding === 'x-deflate') {
    if ((buffer[0] & 0x0f) === 0x08) {
      zlib.inflate(buffer, handler);
    } else {
      zlib.inflateRaw(buffer, handler);
    }
  } else if (encoding === 'br') {
    zlib.brotliDecompress(buffer, handler);
  } else {
    handler(null, buffer);
  }

  return promise.promise;
}
