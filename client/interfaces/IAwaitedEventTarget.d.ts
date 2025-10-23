export default interface IAwaitedEventTarget<T> {
    addEventListener<K extends keyof T>(eventType: K, listenerFn: T[K], options?: any): Promise<void>;
    removeEventListener<K extends keyof T>(eventType: K, listenerFn: T[K]): Promise<void>;
    on<K extends keyof T>(eventType: K, listenerFn: T[K], options?: any): Promise<void>;
    off<K extends keyof T>(eventType: K, listenerFn: T[K]): Promise<void>;
    once<K extends keyof T>(eventType: K, listenerFn: T[K], options?: any): Promise<void>;
}
