"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let idCounter = 0;
class EventSubscriber {
    constructor() {
        this.groups = {};
        this.registeredEventListeners = new Set();
    }
    on(emitter, eventName, handler, includeUnhandledEvents) {
        emitter.on(eventName, handler, includeUnhandledEvents);
        const id = idCounter++;
        const registeredEvent = { id, emitter, eventName, handler };
        this.registeredEventListeners.add(registeredEvent);
        return registeredEvent;
    }
    once(emitter, eventName, handler, includeUnhandledEvents) {
        const id = idCounter++;
        const finalHandler = (...args) => {
            this.removeHandlerById(id);
            return handler(...args);
        };
        const registeredEvent = { id, emitter, eventName, handler: finalHandler };
        emitter.once(eventName, finalHandler, includeUnhandledEvents);
        this.registeredEventListeners.add(registeredEvent);
        return registeredEvent;
    }
    off(...listeners) {
        for (const listener of listeners) {
            if (!listener.emitter)
                continue;
            listener.emitter.off(listener.eventName, listener.handler);
            this.registeredEventListeners.delete(listener);
        }
        listeners.length = 0;
    }
    close(...keepMockEvents) {
        for (const listener of this.registeredEventListeners) {
            if (keepMockEvents.includes(listener.eventName)) {
                // add a mock event handler (like for capturing events)
                listener.emitter.on(listener.eventName, () => null);
            }
            listener.emitter.off(listener.eventName, listener.handler);
        }
        this.registeredEventListeners.clear();
    }
    group(name, ...listeners) {
        this.groups[name] ??= [];
        this.groups[name].push(...listeners);
    }
    endGroup(name) {
        const events = this.groups[name];
        delete this.groups[name];
        if (events)
            this.off(...events);
    }
    removeHandlerById(id) {
        for (const listener of this.registeredEventListeners) {
            if (listener.id === id) {
                this.registeredEventListeners.delete(listener);
                break;
            }
        }
    }
}
exports.default = EventSubscriber;
//# sourceMappingURL=EventSubscriber.js.map