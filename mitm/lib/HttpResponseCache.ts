import IResourceHeaders from "@secret-agent/core-interfaces/IResourceHeaders";

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

  public add(url: string, file: Buffer, headers: IResourceHeaders) {
    const resource = { file } as IResource;
    for (const [key, value] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      const val = value as string;

      if (lower === 'etag') {
        resource.etag = val;
      }
      if (lower === 'content-encoding') {
        resource.encoding = val;
      }
      if (lower === 'expires') {
        resource.expires = val;
      }
      if (lower === 'last-modified') {
        resource.lastModified = val;
      }
      if (lower === 'cache-control') {
        resource.cacheControl = val;
        if (resource.cacheControl.includes('no-store')) {
          return;
        }
      }
    }
    if (!resource.etag) return;

    this.cache.set(url, resource);
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
