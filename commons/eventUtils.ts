import { EventEmitter } from 'events';
import { createPromise } from './utils';
import ITypedEventEmitter from './interfaces/ITypedEventEmitter';
import IPendingWaitEvent, { CanceledPromiseError } from './interfaces/IPendingWaitEvent';
import { IBoundLog } from './Logger';

export interface IRegisteredEventListener {
  emitter: EventEmitter | ITypedEventEmitter<any>;
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

export function addTypedEventListener(
  emitter: ITypedEventEmitter<any>,
  eventName: string | symbol,
  handler: (...args: any[]) => void,
  includeUnhandledEvents?: boolean,
): IRegisteredEventListener {
  emitter.on(eventName, handler, includeUnhandledEvents);
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

export class TypedEventEmitter<T> extends EventEmitter implements ITypedEventEmitter<T> {
  public storeEventsWithoutListeners = false;

  protected logger?: IBoundLog;

  private pendingIdCounter = 0;
  private pendingWaitEvents: IPendingWaitEvent[] = [];

  private eventsToLog = new Set<string | symbol>();
  private storedEvents: { eventType: keyof T & (string | symbol); event?: any }[] = [];

  public cancelPendingEvents(message?: string, excludeEvents?: (keyof T & string)[]) {
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

  public setEventsToLog<K extends keyof T & (string | symbol)>(events: K[]) {
    this.eventsToLog = new Set<string | symbol>(events);
  }

  public async waitOn<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn?: (this: this, event?: T[K]) => boolean,
    timeoutMillis = 30e3,
    includeUnhandledEvents = false,
  ) {
    const promise = createPromise<T[K]>(timeoutMillis, `Timeout waiting for ${String(eventType)}`);

    this.pendingIdCounter += 1;
    const id = this.pendingIdCounter;

    this.pendingWaitEvents.push({
      id,
      event: eventType,
      resolvable: promise,
      error: new CanceledPromiseError(`Event (${String(eventType)}) canceled`),
    });
    const messageId = this.logger?.stats('waitOn', {
      eventType,
    });

    const listener = addTypedEventListener(
      this as ITypedEventEmitter<any>,
      eventType,
      (result: T[K]) => {
        // give the listeners a second to register
        if (!listenerFn || listenerFn.call(this, result)) {
          this.logger?.stats('waitOn.resolve', {
            eventType,
            parentLogId: messageId,
          });
          promise.resolve(result);
        }
      },
      includeUnhandledEvents,
    );

    return promise.promise.finally(() => {
      removeEventListeners([listener]);
      const idx = this.pendingWaitEvents.findIndex(x => x.id === id);
      if (idx >= 0) this.pendingWaitEvents.splice(idx, 1);
    });
  }

  public on<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includeUnhandledEvents = false,
  ) {
    super.on(eventType, listenerFn);
    if (includeUnhandledEvents) this.replayMissedEvents(eventType);
    else this.clearMissedEvents(eventType);
    return this;
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
    includeUnhandledEvents = false,
  ) {
    super.once(eventType, listenerFn);
    if (includeUnhandledEvents) this.replayMissedEvents(eventType);
    else this.clearMissedEvents(eventType);
    return this;
  }

  public emit<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]) {
    if (!super.listenerCount(eventType)) {
      if (this.storeEventsWithoutListeners) {
        this.storedEvents.push({ eventType, event });
      }
      return;
    }
    this.logEvent(eventType, event);

    return super.emit(eventType, event);
  }

  public addListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
    includeUnhandledEvents = false,
  ): this {
    super.addListener(event, listener);
    if (includeUnhandledEvents) this.replayMissedEvents(event);
    else this.clearMissedEvents(event);
    return this;
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
    includeUnhandledEvents = false,
  ): this {
    super.prependListener(event, listener);
    if (includeUnhandledEvents) this.replayMissedEvents(event);
    else this.clearMissedEvents(event);
    return this;
  }

  public prependOnceListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
    includeUnhandledEvents = false,
  ): this {
    super.prependOnceListener(event, listener);
    if (includeUnhandledEvents) this.replayMissedEvents(event);
    else this.clearMissedEvents(event);
    return this;
  }

  private clearMissedEvents(replayEventType: string | symbol) {
    if (!this.storedEvents.length) return;

    const events = [...this.storedEvents];
    this.storedEvents.length = 0;
    for (const { event, eventType } of events) {
      if (eventType !== replayEventType) {
        this.storedEvents.push({ event, eventType });
      }
    }
  }

  private replayMissedEvents(replayEventType: string | symbol) {
    if (!this.storedEvents.length) return;

    const events = [...this.storedEvents];
    this.storedEvents.length = 0;
    for (const { event, eventType } of events) {
      if (eventType === replayEventType) {
        this.logEvent(eventType, event);
        super.emit(eventType, event);
      } else {
        this.storedEvents.push({ event, eventType });
      }
    }
  }

  private logEvent<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]) {
    if (this.eventsToLog.has(eventType)) {
      const data: any = { eventType };
      if (event) data.eventBody = event;
      this.logger?.stats('emit', data);
    }
  }
}
