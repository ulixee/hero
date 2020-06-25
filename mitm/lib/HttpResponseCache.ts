import { IncomingHttpHeaders } from 'http';

// TODO: implement max-age and last-modified cache control https://tools.ietf.org/id/draft-ietf-httpbis-cache-01.html
export default class HttpResponseCache {
  private readonly cache = new Map<string, IResource>();
  private readonly accessList: string[] = [];

  constructor(readonly maxItems = 500) {}

  public get(url: string) {
    const entry = this.cache.get(url);
    if (entry) {
      this.recordAccess(url);
    }
    return entry;
  }

  public add(url: string, file: Buffer, headers: IncomingHttpHeaders) {
    const etag = headers.etag as string;
    const encoding = headers['content-encoding'] as string;
    const cacheControl = headers['cache-control'] as string;
    const lastModified = headers['last-modified'] as string;

    if (cacheControl.includes('no-store') || !etag) return;

    const expires = headers.expires as string;
    this.cache.set(url, { etag, file, encoding, expires, cacheControl, lastModified });
    this.recordAccess(url);
    this.cleanCache();
  }

  private recordAccess(url: string) {
    const idx = this.accessList.indexOf(url);
    if (idx >= 0) {
      this.accessList.splice(idx, 1);
    }
    this.accessList.unshift(url);
  }

  private cleanCache() {
    if (this.accessList.length > this.maxItems) {
      const toDelete = this.accessList.slice(this.maxItems);
      this.accessList.length = this.maxItems;
      for (const url of toDelete) {
        this.cache.delete(url);
      }
    }
  }
}

interface IResource {
  file: Buffer;
  etag: string;
  cacheControl: string;
  lastModified: string;
  expires: string;
  encoding: string;
}
