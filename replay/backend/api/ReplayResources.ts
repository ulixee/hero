import * as zlib from 'zlib';
import { PassThrough } from 'stream';
import getResolvable from '~shared/utils/promise';

const packageJson = require('../../package.json');

export default class ReplayResources {
  private resources: {
    [url: string]: {
      resolve: (resource: IReplayResource) => void;
      promise: Promise<IReplayResource>;
    };
  } = {};

  public onResource(
    resourceMeta: {
      url: string;
      headers: any;
    } & Omit<IReplayResource, 'headers'>,
  ) {
    const { url, headers, statusCode, type, tabId, data } = resourceMeta;
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
    const contentType = resource.headers.get('content-type');
    const headers: any = {
      'Cache-Control': 'public, max-age=500',
      'Content-Type': contentType,
      'X-Replay-Agent': `Secret Agent Replay v${packageJson.version}`,
    };

    if (resource.headers.get('location')) {
      headers.Location = resource.headers.get('location');
    }

    let readable: PassThrough;

    if (resource.type === 'Document' && !isAllowedDocumentContentType(contentType)) {
      readable = new PassThrough();
      const doctype = await getDoctype(resource);
      readable.end(`${doctype}<html><head></head><body></body></html>`);
    } else {
      readable = getResourceStream(resource);
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

function getResourceStream(resource: IReplayResource) {
  const encoding = resource.headers.get('content-encoding');
  let readable = new PassThrough({ autoDestroy: true });
  if (encoding) {
    readable = readable.pipe(getDecodeStream(resource.data[0], encoding));
  }
  readable.end(resource.data);
  return readable;
}

async function getDoctype(resource: IReplayResource) {
  if (resource.doctype !== undefined) return resource.doctype;
  let str = '';
  const readable = getResourceStream(resource);
  for await (const chunk of readable) {
    str += chunk.toString();
    if (str.match(/<\s*html\s+/i)) break;
  }
  readable.destroy();

  const htmlIndex = str.toLowerCase().indexOf('<html>');
  if (htmlIndex !== -1) {
    resource.doctype = str.substr(0, htmlIndex);
  }
  resource.doctype = '';
  return resource.doctype;
}

function isAllowedDocumentContentType(contentType: string) {
  if (!contentType) return false;
  return (
    contentType.includes('json') || contentType.includes('svg') || contentType.includes('font')
  );
}

function getDecodeStream(firstByte: number, encoding: string) {
  if (encoding === 'gzip' || encoding === 'x-gzip') {
    const zlibOptions = {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
    };
    return zlib.createGunzip(zlibOptions);
  }

  if (encoding === 'deflate' || encoding === 'x-deflate') {
    if ((firstByte & 0x0f) === 0x08) {
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
  doctype?: string;
  headers: Map<string, string>;
  type: string;
  statusCode: number;
}
