export default interface IAwaitedEventTarget<T> {
  addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void>;
  removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
  ): Promise<void>;
  on<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void>;
  off<K extends keyof T>(eventType: K, listenerFn: (this: this, event: T[K]) => any): Promise<void>;
  once<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void>;
}
