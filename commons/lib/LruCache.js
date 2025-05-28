"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LruCache {
    constructor(max = 10) {
        this.max = max;
        this.cache = new Map();
    }
    get(key) {
        const item = this.cache.get(key);
        if (item) {
            // refresh key
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }
    remove(key) {
        this.cache.delete(key);
    }
    set(key, val) {
        // refresh key
        if (this.cache.has(key))
            this.cache.delete(key);
        // evict oldest
        else if (this.cache.size === this.max)
            this.cache.delete(this.first());
        this.cache.set(key, val);
    }
    first() {
        return this.cache.keys().next().value;
    }
}
exports.default = LruCache;
//# sourceMappingURL=LruCache.js.map