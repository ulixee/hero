export default class LruCache<T> {
  private cache: Map<string, T>;

  constructor(private max = 10) {
    this.cache = new Map();
  }

  public get(key: string): T {
    const item = this.cache.get(key);
    if (item) {
      // refresh key
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  public remove(key: string): void {
    this.cache.delete(key);
  }

  public set(key: string, val: T): void {
    // refresh key
    if (this.cache.has(key)) this.cache.delete(key);
    // evict oldest
    else if (this.cache.size === this.max) this.cache.delete(this.first());
    this.cache.set(key, val);
  }

  private first(): string {
    return this.cache.keys().next().value;
  }
}
