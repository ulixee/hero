import { ClientHttp2Stream } from 'http2';
import * as zlib from 'zlib';
import { PassThrough } from 'stream';
import getResolvable from '~shared/utils/promise';

export default class ReplayResources {
  private resources: {
    [url: string]: {
      resolve: (resource: IReplayResource) => void;
      promise: Promise<IReplayResource>;
    };
  } = {};

  public async onResource(
    http2Stream: ClientHttp2Stream,
    resourceMeta: {
      url: string;
      headers: any;
      tabId: string;
      statusCode: number;
      type: string;
    },
  ) {
    const { url, headers, statusCode, type, tabId } = resourceMeta;
    this.initResource(url);

    const data: Buffer[] = [];
    for await (const chunk of http2Stream) data.push(chunk);

    const headerMap = new Map<string, string>();
    for (const [k, v] of Object.entries(headers)) {
      headerMap.set(k.toLowerCase(), v as string);
    }

    this.resources[url].resolve({
      data: Buffer.concat(data),
      headers: headerMap,
      tabId,
      statusCode,
      type,
    });
  }

  public async get(url: string) {
    this.initResource(url);
    const resource = await this.resources[url].promise;
    const headers = {
      'Cache-Control': 'public, max-age=500',
      'Content-Type': resource.headers.get('content-type'),
    };

    let readable = new PassThrough();
    if (resource.type === 'Document') {
      const csp = resource.headers.get('content-security-policy');
      if (csp) headers['Content-Security-Policy'] = csp;
      readable.end(`<!DOCTYPE html><html><head></head><body></body></html>`);
    } else {
      const encoding = resource.headers.get('content-encoding');
      if (encoding) {
        readable = readable.pipe(getDecodeStream(resource.data, encoding));
      }
      readable.end(resource.data);
    }
    return {
      data: readable,
      headers,
      statusCode: resource.statusCode,
    };
  }

  private initResource(url: string) {
    if (!this.resources[url]) {
      this.resources[url] = getResolvable<IReplayResource>();
    }
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

interface IReplayResource {
  data: Buffer;
  tabId: string;
  headers: Map<string, string>;
  type: string;
  statusCode: number;
}
