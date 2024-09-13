export default class TimedCache<T> {
  public set value(value: T) {
    this.#value = value;
    if (value !== null) {
      this.#expireTime = Date.now() + this.cacheSeconds * 1e3;
    }
  }

  public get value(): T {
    if (this.#expireTime && this.#expireTime < Date.now()) this.#value = null;
    return this.#value;
  }

  #value: T;
  #expireTime: number;

  constructor(readonly cacheSeconds: number) {}
}
