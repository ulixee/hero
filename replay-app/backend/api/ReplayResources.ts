import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import { ClientHttp2Stream } from 'http2';
import zlib from 'zlib';
import { Readable, PassThrough } from 'stream';

export default class ReplayResources {
  private resources: {
    [url: string]: IResolvablePromise<{
      data: Buffer;
      contentType: string;
      encoding: string;
      type: string;
      statusCode: number;
    }>;
  } = {};

  public async onResource(
    http2Stream: ClientHttp2Stream,
    resourceMeta: {
      url: string;
      contentType: string;
      encoding: string;
      statusCode: number;
      type: string;
    },
  ) {
    const { url, contentType, encoding, statusCode, type } = resourceMeta;
    this.initResource(url);

    const data: Buffer[] = [];
    for await (const chunk of http2Stream) data.push(chunk);

    this.resources[url].resolve({
      data: Buffer.concat(data),
      contentType,
      encoding,
      statusCode,
      type,
    });
  }

  public async get(url: string) {
    this.initResource(url);
    const resource = await this.resources[url].promise;
    const headers = {
      'Cache-Control': 'public, max-age=500',
      'Content-Type': resource.contentType,
    };

    if (resource.type === 'Document') {
      return {
        data: Readable.from([`<html><head></head><body></body></html>`]),
        headers: {
          ...headers,
          'Content-Security-Policy':
            "default-src *; navigate-to 'none'; style-src 'self' http://* https://* 'unsafe-inline'; script-src 'self' http://* https://*; font-src 'self' https://* data:;",
        },
        statusCode: 200,
      };
    }

    let readable = new PassThrough();
    if (resource.encoding) {
      readable = readable.pipe(getDecodeStream(resource.data, resource.encoding));
    }
    readable.end(resource.data);
    return {
      data: readable,
      headers,
      statusCode: resource.statusCode,
    };
  }

  private initResource(url: string) {
    if (!this.resources[url]) this.resources[url] = createPromise();
  }
}

function getDecodeStream(buffer: Buffer, encoding: string) {
  if (encoding === 'gzip' || encoding === 'x-gzip') {
    const zlibOptions = {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
    };
    return zlib.createGunzip(zlibOptions);
  }

  if (encoding === 'deflate' || encoding === 'x-deflate') {
    if ((buffer[0] & 0x0f) === 0x08) {
      return zlib.createInflate();
    }
    return zlib.createInflateRaw();
  }
  if (encoding === 'br') {
    return zlib.createBrotliDecompress();
  }
}
