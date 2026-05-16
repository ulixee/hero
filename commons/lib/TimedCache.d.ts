export default class TimedCache<T> {
    #private;
    readonly cacheSeconds: number;
    set value(value: T);
    get value(): T;
    constructor(cacheSeconds: number);
}
