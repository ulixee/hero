// eslint-disable-next-line max-classes-per-file
import { EventEmitter } from 'events';
import * as Debug from './Debug';
import TimeoutError from './interfaces/TimeoutError';

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

export function addEventListeners(
  emitter: EventEmitter,
  registrations: [string | symbol, (...args: any[]) => void][],
): IRegisteredEventListener[] {
  return registrations.map(([eventName, handler]) => {
    emitter.on(eventName, handler);
    return { emitter, eventName, handler };
  });
}

function waitForEvent<T>(
  emitter: EventEmitter,
  eventName: string | symbol,
  handler?: (...args: any[]) => void,
  timeoutMillis?: number,
  pendingRegistry?: IPendingWaitEvent[],
) {
  return new Promise<T>((resolve, reject) => {
    let timeout: NodeJS.Timeout;
    if (timeoutMillis) {
      const timeoutError = new TimeoutError(`Error waiting for ${String(eventName)}`);
      timeout = setTimeout(() => reject(timeoutError), timeoutMillis);
    }
    if (pendingRegistry) {
      pendingRegistry.push({
        event: eventName,
        timeout,
        reject,
        error: new CanceledPromiseError(`Event (${String(eventName)}) canceled`),
      });
    }
    const listeners: IRegisteredEventListener[] = [];

    const listener = addEventListener(emitter, eventName, result => {
      // give the listeners a second to register
      process.nextTick(() => {
        if (!handler || handler.call(emitter, result)) {
          resolve(result);
          if (pendingRegistry) {
            const idx = pendingRegistry.findIndex(x => x.reject === reject);
            if (idx >= 0) pendingRegistry.splice(idx, 1);
          }
          clearTimeout(timeout);
          removeEventListeners(listeners);
        }
      });
    });
    listeners.push(listener);
  });
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
  waitOn<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn?: (this: this, event?: T[K]) => boolean,
  ): Promise<T[K]>;

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

export class CanceledPromiseError extends Error {}

export interface IPendingWaitEvent {
  event: string | symbol;
  reject: (err: CanceledPromiseError) => any;
  timeout: NodeJS.Timeout;
  error: CanceledPromiseError;
}

export class TypedEventEmitter<T> extends EventEmitter implements ITypedEventEmitter<T> {
  private pendingWaitEvents: IPendingWaitEvent[] = [];

  public cancelPendingEvents(message?: string, excludeEvents?: (keyof T & string)[]) {
    const events = [...this.pendingWaitEvents];
    this.pendingWaitEvents.length = 0;
    while (events.length) {
      const event = events.shift();
      if (excludeEvents && excludeEvents.includes(event.event as any)) {
        this.pendingWaitEvents.push(event);
        continue;
      }
      clearTimeout(event.timeout);
      if (message) event.error.message = message;
      event.reject(event.error);
    }
  }

  public async waitOn<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn?: (this: this, event?: T[K]) => boolean,
    timeoutMillis = 30e3,
  ) {
    return waitForEvent<T[K]>(this, eventType, listenerFn, timeoutMillis, this.pendingWaitEvents);
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
    if (!super.listenerCount(eventType)) return;
    const ns = `emit:${eventType}`;
    if (Debug.isEnabled(ns)) {
      Debug.debug(ns)(JSON.stringify(event));
    }
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
