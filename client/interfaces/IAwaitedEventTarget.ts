export default interface IAwaitedEventTarget<T> {
  addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (...argArray: T[K] & any[]) => any,
    options?,
  ): Promise<void>;
  removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (...argArray: T[K] & any[]) => any,
  ): Promise<void>;
  on<K extends keyof T>(
    eventType: K,
    listenerFn: (...argArray: T[K] & any[]) => any,
    options?,
  ): Promise<void>;
  off<K extends keyof T>(
    eventType: K,
    listenerFn: (...argArray: T[K] & any[]) => any,
  ): Promise<void>;
  once<K extends keyof T>(
    eventType: K,
    listenerFn: (...argArray: T[K] & any[]) => any,
    options?,
  ): Promise<void>;
}
