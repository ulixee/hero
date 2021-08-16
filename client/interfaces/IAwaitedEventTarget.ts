export default interface IAwaitedEventTarget<T> {
  addEventListener<K extends keyof T>(eventType: K, listenerFn: T[K], options?): Promise<void>;
  removeEventListener<K extends keyof T>(eventType: K, listenerFn: T[K]): Promise<void>;
  on<K extends keyof T>(eventType: K, listenerFn: T[K], options?): Promise<void>;
  off<K extends keyof T>(eventType: K, listenerFn: T[K]): Promise<void>;
  once<K extends keyof T>(eventType: K, listenerFn: T[K], options?): Promise<void>;
}
