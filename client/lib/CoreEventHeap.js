"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const DisconnectedError_1 = require("@ulixee/net/errors/DisconnectedError");
const { log } = (0, Logger_1.default)(module);
class CoreEventHeap {
    constructor(meta, connection, commandCounter, callsiteLocator) {
        this.listenerFnById = new Map();
        this.listenerIdByHandle = new Map();
        this.eventInterceptors = new Map();
        this.pendingRegistrations = Promise.resolve();
        this.meta = meta;
        this.connection = connection;
        this.commandCounter = commandCounter;
        this.callsiteLocator = callsiteLocator;
    }
    hasEventInterceptors(type) {
        return this.eventInterceptors.has(type);
    }
    registerEventInterceptors(interceptors) {
        for (const [type, interceptor] of Object.entries(interceptors)) {
            const events = this.eventInterceptors.get(type) ?? [];
            events.push(interceptor);
            this.eventInterceptors.set(type, events);
        }
    }
    async addListener(jsPath, type, listenerFn, options, extras) {
        const handle = this.generateListenerHandle(jsPath, type, listenerFn);
        if (this.listenerIdByHandle.has(handle))
            return;
        extras ??= {};
        extras.callsite ??= this.callsiteLocator.getCurrent();
        const subscriptionPromise = this.connection.sendRequest({
            commandId: this.commandCounter.nextCommandId,
            meta: this.meta,
            startTime: Date.now(),
            command: 'Events.addEventListener',
            args: [jsPath, type, options],
            ...extras,
        });
        const registered = new Resolvable_1.default();
        this.pendingRegistrations = this.pendingRegistrations.then(() => registered.promise);
        try {
            const response = await subscriptionPromise;
            const { listenerId } = response;
            const wrapped = this.wrapHandler(type, listenerFn);
            this.listenerFnById.set(listenerId, wrapped);
            this.listenerIdByHandle.set(handle, listenerId);
        }
        finally {
            registered.resolve();
        }
    }
    removeListener(jsPath, type, listenerFn, options, extras) {
        const handle = this.generateListenerHandle(jsPath, type, listenerFn);
        const listenerId = this.listenerIdByHandle.get(handle);
        if (!listenerId)
            return;
        extras ??= {};
        extras.callsite ??= this.callsiteLocator.getCurrent();
        this.connection
            .sendRequest({
            commandId: this.commandCounter.nextCommandId,
            meta: this.meta,
            startTime: Date.now(),
            command: 'Events.removeEventListener',
            args: [listenerId, options],
            ...extras,
        })
            .catch(error => {
            if (error instanceof DisconnectedError_1.default)
                return;
            log.warn('removeEventListener Error: ', { error, sessionId: this.meta?.sessionId });
        });
        this.listenerFnById.delete(listenerId);
        this.listenerIdByHandle.delete(handle);
    }
    incomingEvent(meta, listenerId, eventArgs) {
        let waitForPending = Promise.resolve();
        if (!this.listenerFnById.has(listenerId)) {
            waitForPending = this.pendingRegistrations;
        }
        waitForPending
            .then(() => {
            const listenerFn = this.listenerFnById.get(listenerId);
            if (listenerFn)
                listenerFn(...eventArgs);
            return null;
        })
            .catch(error => {
            log.error('incomingEvent Error: ', { error, sessionId: this.meta?.sessionId });
        });
    }
    generateListenerHandle(jsPath, type, listenerFn) {
        const parts = [jsPath ? JSON.stringify(jsPath) : 'BASE'];
        parts.push(type);
        parts.push(listenerFn.toString());
        return parts.join(':');
    }
    wrapHandler(type, listenerFn) {
        if (!this.eventInterceptors.has(type))
            return listenerFn;
        const interceptorFns = this.eventInterceptors.get(type);
        return (...args) => {
            let processedArgs = args;
            for (const fn of interceptorFns) {
                let result = fn(...processedArgs);
                if (!Array.isArray(result))
                    result = [result];
                processedArgs = result;
            }
            listenerFn(...processedArgs);
        };
    }
}
exports.default = CoreEventHeap;
//# sourceMappingURL=CoreEventHeap.js.map