import * as zlib from "zlib";
import { PassThrough } from "stream";
import getResolvable from "~shared/utils/promise";

const packageJson = require('../../package.json');

export default class ReplayResources {
  private resources: {
    [url: string]: {
      resolve: (resource: IReplayResource) => void;
      promise: Promise<IReplayResource>;
    };
  } = {};

  public onResource(
    data: Buffer,
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

    const headerMap = new Map<string, string>();
    for (const [k, v] of Object.entries(headers)) {
      headerMap.set(k.toLowerCase(), v as string);
    }

    this.resources[url].resolve({
      data,
      headers: headerMap,
      tabId,
      statusCode,
      type,
    });
  }

  public async get(urlStr: string) {
    const url = urlStr.split('#').shift();
    this.initResource(url);
    const resource = await this.resources[url].promise;
    const headers: any = {
      'Cache-Control': 'public, max-age=500',
      'Content-Type': resource.headers.get('content-type'),
      'X-Replay-Agent': `Secret Agent Replay v${packageJson.version}`,
    };

    if (resource.headers.get('location')) {
      headers.Location = resource.headers.get('location');
    }

    let readable = new PassThrough();
    if (resource.type === 'Document') {
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
