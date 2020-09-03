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

export class TypedEventEmitter<T> extends EventEmitter {
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
