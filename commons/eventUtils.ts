import { EventEmitter } from 'events';
import ITypedEventEmitter from '@secret-agent/core-interfaces/ITypedEventEmitter';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { createPromise } from './utils';
import IPendingWaitEvent, { CanceledPromiseError } from './interfaces/IPendingWaitEvent';

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
  registrations: [string | symbol, (...args: any[]) => void, boolean?][],
): IRegisteredEventListener[] {
  return registrations.map(([eventName, handler]) => {
    emitter.on(eventName, handler);
    return { emitter, eventName, handler };
  });
}

export function removeEventListeners(
  listeners: Array<{
    emitter: EventEmitter | ITypedEventEmitter<any>;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
  }>,
): void {
  for (const listener of listeners) {
    listener.emitter.removeListener(listener.eventName, listener.handler);
  }
  listeners.length = 0;
}

export function addTypedEventListener<T, K extends keyof T & (string | symbol)>(
  emitter: TypedEventEmitter<T>,
  eventName: K,
  handler: (this: TypedEventEmitter<T>, event?: T[K], initiator?: any) => any,
  includeUnhandledEvents?: boolean,
): IRegisteredEventListener {
  emitter.on(eventName, handler, includeUnhandledEvents);
  return { emitter, eventName, handler };
}

export function addTypedEventListeners<T, K extends keyof T & (string | symbol)>(
  emitter: TypedEventEmitter<T>,
  registrations: [K, (this: TypedEventEmitter<T>, event?: T[K]) => any, boolean?][],
): IRegisteredEventListener[] {
  return registrations.map(([eventName, handler, includeUnhandled]) => {
    emitter.on(eventName, handler, includeUnhandled);
    return { emitter, eventName, handler };
  });
}

export class TypedEventEmitter<T> extends EventEmitter implements ITypedEventEmitter<T> {
  public storeEventsWithoutListeners = false;

  protected logger?: IBoundLog;

  private pendingIdCounter = 0;
  private pendingWaitEvents: IPendingWaitEvent[] = [];

  private eventsToLog = new Set<string | symbol>();
  private storedEventsByType = new Map<keyof T & (string | symbol), any[]>();
  private reemitterCountByEventType: { [eventType: string]: number } = {};

  public cancelPendingEvents(message?: string, excludeEvents?: (keyof T & string)[]): void {
    const events = [...this.pendingWaitEvents];
    this.pendingWaitEvents.length = 0;
    while (events.length) {
      const event = events.shift();
      if (excludeEvents && excludeEvents.includes(event.event as any)) {
        this.pendingWaitEvents.push(event);
        continue;
      }
      if (message) event.error.message = message;
      event.resolvable.reject(event.error);
    }
  }

  public setEventsToLog<K extends keyof T & (string | symbol)>(events: K[]): void {
    this.eventsToLog = new Set<string | symbol>(events);
  }

  public waitOn<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn?: (this: this, event?: T[K]) => boolean,
    timeoutMillis = 30e3,
  ): Promise<T[K]> {
    const promise = createPromise<T[K]>(
      timeoutMillis ?? 30e3,
      `Timeout waiting for ${String(eventType)}`,
    );

    this.pendingIdCounter += 1;
    const id = this.pendingIdCounter;

    this.pendingWaitEvents.push({
      id,
      event: eventType,
      resolvable: promise,
      error: new CanceledPromiseError(`Event (${String(eventType)}) canceled`),
    });
    const messageId = this.logger?.stats(`waitOn:${eventType}`, {
      timeoutMillis,
    });

    const listener = addTypedEventListener(this, eventType, (result: T[K]) => {
      // give the listeners a second to register
      if (!listenerFn || listenerFn.call(this, result)) {
        this.logger?.stats(`waitOn.resolve:${eventType}`, {
          parentLogId: messageId,
        });
        promise.resolve(result);
      }
    });

    return promise.promise.finally(() => {
      removeEventListeners([listener]);
      const idx = this.pendingWaitEvents.findIndex(x => x.id === id);
      if (idx >= 0) this.pendingWaitEvents.splice(idx, 1);
    });
  }

  public addEventEmitter<Y, K extends keyof T & keyof Y & (string | symbol)>(
    emitter: TypedEventEmitter<Y>,
    eventTypes: K[],
  ): IRegisteredEventListener[] {
    const listeners: IRegisteredEventListener[] = [];
    for (const eventName of eventTypes) {
      const handler = emitter.emit.bind(emitter, eventName);
      listeners.push({ handler, eventName, emitter: this });
      super.on(eventName, handler);
      this.reemitterCountByEventType[eventName as string] ??= 0;
      this.reemitterCountByEventType[eventName as string] += 1;
    }
    return listeners;
  }

  public on<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includeUnhandledEvents = false,
  ): this {
    super.on(eventType, listenerFn);
    return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
  }

  public off<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
  ): this {
    return super.off(eventType, listenerFn);
  }

  public once<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includeUnhandledEvents = false,
  ): this {
    super.once(eventType, listenerFn);
    return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
  }

  public emit<K extends keyof T & (string | symbol)>(
    eventType: K,
    event?: T[K],
    sendInitiator?: object,
  ): boolean {
    const listeners = super.listenerCount(eventType);
    if (this.storeEventsWithoutListeners && !listeners) {
      if (!this.storedEventsByType.has(eventType)) this.storedEventsByType.set(eventType, []);
      this.storedEventsByType.get(eventType).push(event);
      return false;
    }
    this.logEvent(eventType, event);

    return super.emit(eventType, event, sendInitiator);
  }

  public addListener<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includeUnhandledEvents = false,
  ): this {
    return this.on(eventType, listenerFn, includeUnhandledEvents);
  }

  public removeListener<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
  ): this {
    return super.removeListener(eventType, listenerFn);
  }

  public prependListener<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => void,
    includeUnhandledEvents = false,
  ): this {
    super.prependListener(eventType, listenerFn);
    return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
  }

  public prependOnceListener<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => void,
    includeUnhandledEvents = false,
  ): this {
    super.prependOnceListener(eventType, listenerFn);
    return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
  }

  private replayOrClearMissedEvents<K extends keyof T & (string | symbol)>(
    shouldReplay: boolean,
    eventType: K,
  ): this {
    const events = this.storedEventsByType.get(eventType);
    if (!events || !events.length) return this;
    this.storedEventsByType.delete(eventType);
    if (shouldReplay) {
      for (const event of events) {
        this.logEvent(eventType, event);
        super.emit(eventType, event);
      }
    }
    return this;
  }

  private logEvent<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]): void {
    if (this.eventsToLog.has(eventType)) {
      let data: any = event;
      if (eventType) {
        if (typeof event === 'object') {
          if ((event as any).toJSON) {
            data = (event as any).toJSON();
          } else {
            data = { ...event };
            for (const [key, val] of Object.entries(data)) {
              if (!val) continue;
              if ((val as any).toJSON) {
                data[key] = (val as any).toJSON();
              }
            }
          }
        }
      }
      this.logger?.stats(`emit:${eventType}`, data);
    }
  }
}
