"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: implement max-age and last-modified cache control https://tools.ietf.org/id/draft-ietf-httpbis-cache-01.html
class HttpResponseCache {
    constructor(maxItems = 500) {
        this.maxItems = maxItems;
        this.cache = new Map();
        this.accessList = [];
    }
    get(url) {
        const entry = this.cache.get(url);
        if (entry) {
            this.recordAccess(url);
        }
        return entry;
    }
    add(url, file, headers) {
        const resource = { file };
        for (const [key, value] of Object.entries(headers)) {
            const lower = key.toLowerCase();
            const val = value;
            if (lower === 'etag') {
                resource.etag = val;
            }
            if (lower === 'content-encoding') {
                resource.encoding = val;
            }
            if (lower === 'content-type') {
                resource.contentType = val;
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
        if (!resource.etag)
            return;
        this.cache.set(url, resource);
        this.recordAccess(url);
        this.cleanCache();
    }
    recordAccess(url) {
        const idx = this.accessList.indexOf(url);
        if (idx >= 0) {
            this.accessList.splice(idx, 1);
        }
        this.accessList.unshift(url);
    }
    cleanCache() {
        if (this.accessList.length > this.maxItems) {
            const toDelete = this.accessList.slice(this.maxItems);
            this.accessList.length = this.maxItems;
            for (const url of toDelete) {
                this.cache.delete(url);
            }
        }
    }
}
exports.default = HttpResponseCache;
//# sourceMappingURL=HttpResponseCache.js.map