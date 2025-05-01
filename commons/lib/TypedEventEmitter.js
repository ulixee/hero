"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TypedEventEmitter_logger;
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const IPendingWaitEvent_1 = require("../interfaces/IPendingWaitEvent");
const utils_1 = require("./utils");
class TypedEventEmitter extends events_1.EventEmitter {
    constructor() {
        super();
        this.storeEventsWithoutListeners = false;
        _TypedEventEmitter_logger.set(this, void 0);
        this.pendingIdCounter = 0;
        this.pendingWaitEventsById = new Map();
        this.eventsToLog = new Set();
        this.storedEventsByType = new Map();
        this.reemitterCountByEventType = {};
        this.defaultErrorLogger = this.defaultErrorLogger.bind(this);
        if ('captureRejections' in this)
            this.captureRejections = true;
        // add an error logger as a backup
        super.on('error', this.defaultErrorLogger);
    }
    cancelPendingEvents(message, excludeEvents) {
        this.storedEventsByType.clear();
        const events = [...this.pendingWaitEventsById.values()];
        this.pendingWaitEventsById.clear();
        while (events.length) {
            const event = events.shift();
            if (excludeEvents && excludeEvents.includes(event.event)) {
                this.pendingWaitEventsById.set(event.id, event);
                continue;
            }
            if (message)
                event.error.message = message;
            // catch unhandled rejections here: eslint-disable-next-line promise/no-promise-in-callback
            event.resolvable.promise.catch(() => null);
            event.resolvable.reject(event.error);
        }
    }
    setEventsToLog(logger, events) {
        __classPrivateFieldSet(this, _TypedEventEmitter_logger, logger, "f");
        this.eventsToLog = new Set(events);
    }
    waitOn(eventType, listenerFn, timeoutMillis = 30e3) {
        const promise = (0, utils_1.createPromise)(timeoutMillis ?? 30e3, `Timeout waiting for ${String(eventType)}`);
        this.pendingIdCounter += 1;
        const id = this.pendingIdCounter;
        this.pendingWaitEventsById.set(id, {
            id,
            event: eventType,
            resolvable: promise,
            error: new IPendingWaitEvent_1.CanceledPromiseError(`Event (${String(eventType)}) canceled`),
        });
        const messageId = __classPrivateFieldGet(this, _TypedEventEmitter_logger, "f")?.stats?.(`waitOn:${String(eventType)}`, {
            timeoutMillis,
        });
        const callbackFn = (result) => {
            // give the listeners a second to register
            if (!listenerFn || listenerFn.call(this, result)) {
                __classPrivateFieldGet(this, _TypedEventEmitter_logger, "f")?.stats?.(`waitOn.resolve:${String(eventType)}`, {
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
    addEventEmitter(emitter, eventTypes) {
        const listeners = [];
        for (const eventName of eventTypes) {
            const handler = emitter.emit.bind(emitter, eventName);
            listeners.push({ handler, eventName, emitter: this });
            super.on(eventName, handler);
            this.reemitterCountByEventType[eventName] ??= 0;
            this.reemitterCountByEventType[eventName] += 1;
        }
        return listeners;
    }
    on(eventType, listenerFn, includeUnhandledEvents = false) {
        super.on(eventType, listenerFn);
        // if we're adding an error logger, we can remove the default logger
        if (eventType === 'error' && listenerFn !== this.defaultErrorLogger) {
            super.off('error', this.defaultErrorLogger);
        }
        this.onEventListenerAdded?.(eventType);
        return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
    }
    off(eventType, listenerFn) {
        // if we're removing an error logger, we should add back the default logger
        if (eventType === 'error' &&
            listenerFn !== this.defaultErrorLogger &&
            super.listenerCount(eventType) === 1) {
            super.on('error', this.defaultErrorLogger);
        }
        return super.off(eventType, listenerFn);
    }
    once(eventType, listenerFn, includeUnhandledEvents = false) {
        super.once(eventType, listenerFn);
        this.onEventListenerAdded?.(eventType);
        return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
    }
    emit(eventType, event, sendInitiator) {
        const listeners = super.listenerCount(eventType);
        if (this.storeEventsWithoutListeners && !listeners) {
            if (!this.storedEventsByType.has(eventType))
                this.storedEventsByType.set(eventType, []);
            this.storedEventsByType.get(eventType).push(event);
            return false;
        }
        this.logEvent(eventType, event);
        if (sendInitiator)
            return super.emit(eventType, event, sendInitiator);
        return super.emit(eventType, event);
    }
    addListener(eventType, listenerFn, includeUnhandledEvents = false) {
        return this.on(eventType, listenerFn, includeUnhandledEvents);
    }
    removeListener(eventType, listenerFn) {
        return super.removeListener(eventType, listenerFn);
    }
    prependListener(eventType, listenerFn, includeUnhandledEvents = false) {
        super.prependListener(eventType, listenerFn);
        return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
    }
    prependOnceListener(eventType, listenerFn, includeUnhandledEvents = false) {
        super.prependOnceListener(eventType, listenerFn);
        return this.replayOrClearMissedEvents(includeUnhandledEvents, eventType);
    }
    defaultErrorLogger(error) {
        if (__classPrivateFieldGet(this, _TypedEventEmitter_logger, "f"))
            __classPrivateFieldGet(this, _TypedEventEmitter_logger, "f").error('EventListenerError', error);
        else
            console.warn('EventListenerError', error);
    }
    replayOrClearMissedEvents(shouldReplay, eventType) {
        const events = this.storedEventsByType.get(eventType);
        if (!events || !events.length)
            return this;
        this.storedEventsByType.delete(eventType);
        if (shouldReplay) {
            for (const event of events) {
                this.logEvent(eventType, event);
                super.emit(eventType, event);
            }
        }
        return this;
    }
    logEvent(eventType, event) {
        if (this.eventsToLog.has(eventType)) {
            let data = event;
            if (eventType) {
                if (typeof event === 'object') {
                    if (event.toJSON) {
                        data = event.toJSON();
                    }
                    else {
                        data = { ...event };
                        for (const [key, val] of Object.entries(data)) {
                            if (!val)
                                continue;
                            if (val.toJSON) {
                                data[key] = val.toJSON();
                            }
                        }
                    }
                }
            }
            __classPrivateFieldGet(this, _TypedEventEmitter_logger, "f")?.stats?.(`emit:${String(eventType)}`, data);
        }
    }
}
_TypedEventEmitter_logger = new WeakMap();
exports.default = TypedEventEmitter;
//# sourceMappingURL=TypedEventEmitter.js.map