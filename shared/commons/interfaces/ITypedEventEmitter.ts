import IRegisteredEventListener from './IRegisteredEventListener';

export default interface ITypedEventEmitter<T> {
  on<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includeUnhandledEvents?: boolean,
  ): this;

  off<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  once<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includeUnhandledEvents?: boolean,
  ): this;

  emit<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]): boolean;

  addListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
    includeUnhandledEvents?: boolean,
  ): this;

  removeListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  prependListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
    includeUnhandledEvents?: boolean,
  ): this;

  prependOnceListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
    includeUnhandledEvents?: boolean,
  ): this;

  removeAllListeners(event?: string | symbol): this;
  addEventEmitter<K extends keyof T & (string | symbol)>(
    emitter: ITypedEventEmitter<T>,
    eventTypes: K[],
  ): IRegisteredEventListener[];
}
