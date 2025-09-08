export default class LruCache<T> {
    private max;
    private cache;
    constructor(max?: number);
    get(key: string): T;
    remove(key: string): void;
    set(key: string, val: T): void;
    private first;
}
