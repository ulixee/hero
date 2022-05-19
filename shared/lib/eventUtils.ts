import { EventEmitter } from 'events';
import ITypedEventEmitter from '../interfaces/ITypedEventEmitter';
import IRegisteredEventListener from '../interfaces/IRegisteredEventListener';
import { IBoundLog } from '../interfaces/ILog';
import { createPromise } from './utils';
import IPendingWaitEvent, { CanceledPromiseError } from '../interfaces/IPendingWaitEvent';

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
  listeners: Array<IRegisteredEventListener>,
): void {
  for (const listener of listeners) {
    listener.emitter.off(listener.eventName, listener.handler);
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
  public EventTypes: T;

  protected logger?: IBoundLog;

  private pendingIdCounter = 0;
  private pendingWaitEventsById = new Map<number, IPendingWaitEvent>();

  private eventsToLog = new Set<string | symbol>();
  private storedEventsByType = new Map<keyof T & (string | symbol), any[]>();
  private reemitterCountByEventType: { [eventType: string]: number } = {};

  public cancelPendingEvents(message?: string, excludeEvents?: (keyof T & string)[]): void {
    this.storedEventsByType.clear();
    const events = [...this.pendingWaitEventsById.values()];
    this.pendingWaitEventsById.clear();
    while (events.length) {
      const event = events.shift();
      if (excludeEvents && excludeEvents.includes(event.event as any)) {
        this.pendingWaitEventsById.set(event.id, event);
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

    this.pendingWaitEventsById.set(id, {
      id,
      event: eventType,
      resolvable: promise,
      error: new CanceledPromiseError(`Event (${String(eventType)}) canceled`),
    });
    const messageId = this.logger?.stats(`waitOn:${eventType}`, {
      timeoutMillis,
    });
    const callbackFn = (result: T[K]): void => {
      // give the listeners a second to register
      if (!listenerFn || listenerFn.call(this, result)) {
        this.logger?.stats(`waitOn.resolve:${eventType}`, {
          parentLogId: messageId,
        });
        promise.resolve(result);
      }
    };
    this.on(eventType, callbackFn);

    return promise.promise.finally(() => {
      this.off(eventType, callbackFn);
      this.pendingWaitEventsById.delete(id);
    });
  }

  public addEventEmitter<Y, K extends keyof T & keyof Y & (string | symbol)>(
    emitter: TypedEventEmitter<Y>,
    eventTypes: K[],
  ): IRegisteredEventListener[] {
    const listeners: IRegisteredEventListener[] = [];
    for (const eventName of eventTypes) {
      const handler = emitter.emit.bind(emitter, eventName as any);
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
    if (sendInitiator) return super.emit(eventType, event, sendInitiator);
    else return super.emit(eventType, event);
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
