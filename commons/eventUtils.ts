import { EventEmitter } from 'events';

export interface IRegisteredEventListener {
  emitter: EventEmitter;
  eventName: string | symbol;
  handler: (...args: any[]) => void;
}

export function addEventListener(
  emitter: EventEmitter,
  eventName: string | symbol,
  handler: (...args: any[]) => void,
): IRegisteredEventListener {
  emitter.on(eventName, handler);
  return { emitter, eventName, handler };
}

export function removeEventListeners(
  listeners: Array<{
    emitter: EventEmitter;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
  }>,
): void {
  for (const listener of listeners) {
    listener.emitter.removeListener(listener.eventName, listener.handler);
  }
  listeners.length = 0;
}

export interface ITypedEventEmitter<T> {
  on<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
  ): this;

  off<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  once<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
  ): this;

  emit<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]): boolean;

  addListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  removeListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  prependListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
  ): this;

  prependOnceListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
  ): this;
}

export class TypedEventEmitter<T> extends EventEmitter implements ITypedEventEmitter<T> {
  public async waitOn<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn?: (this: this, event?: T[K]) => boolean,
  ) {
    return new Promise<T[K]>(resolve => {
      const listeners: IRegisteredEventListener[] = [];

      const listener = addEventListener(this, eventType, result => {
        // give the listeners a second to register
        process.nextTick(() => {
          if (!listenerFn || listenerFn.call(this, result)) {
            resolve(result);
            removeEventListeners(listeners);
          }
        });
      });
      listeners.push(listener);
    });
  }

  public on<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
  ) {
    return super.on(eventType, listenerFn);
  }

  public off<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this {
    return super.off(event, listener);
  }

  public once<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
  ) {
    return super.once(eventType, listenerFn);
  }

  public emit<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]) {
    return super.emit(eventType, event);
  }

  public addListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this {
    return super.addListener(event, listener);
  }

  public removeListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this {
    return super.removeListener(event, listener);
  }

  public prependListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
  ): this {
    return super.prependListener(event, listener);
  }

  public prependOnceListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
  ): this {
    return super.prependOnceListener(event, listener);
  }
}
