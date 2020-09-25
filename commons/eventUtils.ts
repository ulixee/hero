// eslint-disable-next-line max-classes-per-file
import { EventEmitter } from "events";
import * as Debug from "./Debug";
import { createPromise, IResolvablePromise } from "./utils";

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

export function addTypedEventListener(
  emitter: TypedEventEmitter<any>,
  eventName: string | symbol,
  handler: (...args: any[]) => void,
  includePreviousEvents?: boolean,
): IRegisteredEventListener {
  emitter.on(eventName, handler, includePreviousEvents);
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
    timeoutMillis?: number,
    includePreviousEvents?: boolean,
  ): Promise<T[K]>;

  on<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includePreviousEvents?: boolean,
  ): this;

  off<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  once<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn: (this: this, event?: T[K]) => any,
    includePreviousEvents?: boolean,
  ): this;

  emit<K extends keyof T & (string | symbol)>(eventType: K, event?: T[K]): boolean;

  addListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
    includePreviousEvents?: boolean,
  ): this;

  removeListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => any,
  ): this;

  prependListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
    includePreviousEvents?: boolean,
  ): this;

  prependOnceListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
    includePreviousEvents?: boolean,
  ): this;
}

export class CanceledPromiseError extends Error {}

export interface IPendingWaitEvent {
  id: number;
  event: string | symbol;
  resolvable: IResolvablePromise;
  error: CanceledPromiseError;
}

export class TypedEventEmitter<T> extends EventEmitter implements ITypedEventEmitter<T> {
  public storeEventsWithoutListeners = false;

  protected set logPrefix(value: string) {
    this._logPrefix = value;
    this.isDebugEnabled = Debug.isEnabled(this._logPrefix);
  }

  private pendingIdCounter = 0;
  private _logPrefix: string;
  private isDebugEnabled: boolean;

  private pendingWaitEvents: IPendingWaitEvent[] = [];
  private eventsToLog = new Set<string | symbol>();
  private storedEvents: { eventType: keyof T & (string | symbol); event?: any }[] = [];

  constructor() {
    super();
    this.logPrefix = 'emit';
  }

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

  public setEventsToLog<K extends keyof T & (string | symbol)>(events: K[], logPrefix?: string) {
    this.eventsToLog = new Set<string | symbol>(events);
    if (logPrefix) {
      this.logPrefix = logPrefix;
    }
  }

  public async waitOn<K extends keyof T & (string | symbol)>(
    eventType: K,
    listenerFn?: (this: this, event?: T[K]) => boolean,
    timeoutMillis = 30e3,
    includePreviousEvents = false,
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

    const listener = addTypedEventListener(
      this,
      eventType,
      (result: T[K]) => {
        // give the listeners a second to register
        if (!listenerFn || listenerFn.call(this, result)) {
          promise.resolve(result);
        }
      },
      includePreviousEvents,
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
    includePreviousEvents = false,
  ) {
    super.on(eventType, listenerFn);
    if (includePreviousEvents) this.replayMissedEvents(eventType);
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
    includePreviousEvents = false,
  ) {
    super.once(eventType, listenerFn);
    if (includePreviousEvents) this.replayMissedEvents(eventType);
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
    includePreviousEvents = false,
  ): this {
    super.addListener(event, listener);
    if (includePreviousEvents) this.replayMissedEvents(event);
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
    includePreviousEvents = false,
  ): this {
    super.prependListener(event, listener);
    if (includePreviousEvents) this.replayMissedEvents(event);
    else this.clearMissedEvents(event);
    return this;
  }

  public prependOnceListener<K extends keyof T & (string | symbol)>(
    event: K,
    listener: (this: this, event?: T[K]) => void,
    includePreviousEvents = false,
  ): this {
    super.prependOnceListener(event, listener);
    if (includePreviousEvents) this.replayMissedEvents(event);
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
    if (this.eventsToLog.has(eventType) && this.isDebugEnabled) {
      const ns = `${this._logPrefix}:${eventType}`;
      Debug.debug(ns)(JSON.stringify(event));
    }
  }
}
