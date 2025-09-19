"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const SessionClosedOrMissingError_1 = require("@ulixee/commons/lib/SessionClosedOrMissingError");
const utils_1 = require("@ulixee/commons/lib/utils");
const DisconnectedError_1 = require("../errors/DisconnectedError");
const PendingMessages_1 = require("./PendingMessages");
const { log } = (0, Logger_1.default)(module);
class ConnectionToCore extends eventUtils_1.TypedEventEmitter {
    constructor(transport) {
        super();
        this.transport = transport;
        this.autoReconnect = true;
        this.hooks = {};
        this.pendingMessages = new PendingMessages_1.default();
        this.events = new EventSubscriber_1.default();
        this.didCallConnectionTerminated = false;
        (0, utils_1.bindFunctions)(this);
        this.events.on(transport, 'disconnected', this.onConnectionTerminated);
        this.events.on(transport, 'message', this.onMessage);
    }
    async connect(options = {}) {
        if (this.disconnectAction?.isCallingHook) {
            return;
        }
        if (this.connectAction)
            return this.connectAction.resolvable.promise;
        const { timeoutMs, isAutoConnect, shouldAutoReconnect } = options;
        if (shouldAutoReconnect !== undefined)
            this.autoReconnect = shouldAutoReconnect;
        const connectAction = {
            isAutomatic: isAutoConnect,
            startTime: Date.now(),
            resolvable: new Resolvable_1.default(),
        };
        this.disconnectAction = null;
        try {
            this.connectAction = connectAction;
            await this.transport.connect?.(timeoutMs);
            this.didCallConnectionTerminated = false;
            await this.afterConnectHook();
            connectAction.resolvable.resolve();
            this.emit('connected');
        }
        catch (err) {
            delete this.connectAction;
            connectAction.resolvable.reject(err, true);
        }
        return connectAction.resolvable.promise;
    }
    async disconnect(fatalError) {
        this.autoReconnect = false;
        if (this.disconnectAction)
            return this.disconnectAction.resolvable.promise;
        const disconnectAction = {
            isAutomatic: false,
            startTime: Date.now(),
            resolvable: new Resolvable_1.default(),
            error: fatalError,
        };
        this.disconnectAction = disconnectAction;
        try {
            const logid = log.stats('ConnectionToCore.Disconnecting', {
                host: this.transport.host,
                sessionId: null,
            });
            this.pendingMessages.cancel(new DisconnectedError_1.default(this.transport.host));
            await this.beforeDisconnectHook();
            this.transport.disconnect?.();
            await this.onConnectionTerminated();
            this.connectAction = null;
            log.stats('ConnectionToCore.Disconnected', {
                parentLogId: logid,
                host: this.transport.host,
                sessionId: null,
            });
        }
        finally {
            disconnectAction.resolvable.resolve();
        }
        return disconnectAction.resolvable.promise;
    }
    async sendRequest(payload, timeoutMs) {
        const activeConnectHook = this.connectAction?.isCallingHook && this.connectAction;
        const activeDisconnectHook = this.disconnectAction?.isCallingHook && this.disconnectAction;
        // if we are not connected, try to connect (except during a disconnect)
        if (this.shouldAutoConnect()) {
            await this.connect({ timeoutMs, isAutoConnect: true });
        }
        const { promise, id } = this.pendingMessages.create(timeoutMs, !!activeConnectHook || !!activeDisconnectHook);
        if (activeConnectHook)
            activeConnectHook.hookMessageId = id;
        if (activeDisconnectHook)
            activeDisconnectHook.hookMessageId = id;
        try {
            const [result] = await Promise.all([
                promise,
                this.transport.send({
                    ...payload,
                    messageId: id,
                    sendTime: Date.now(),
                }),
            ]);
            return result;
        }
        catch (error) {
            this.pendingMessages.delete(id);
            if (this.disconnectAction && error instanceof IPendingWaitEvent_1.CanceledPromiseError) {
                return;
            }
            throw error;
        }
        finally {
            if (activeConnectHook)
                activeConnectHook.hookMessageId = null;
            if (activeDisconnectHook)
                activeDisconnectHook.hookMessageId = null;
        }
    }
    /**
     * Override fn to control active sessions
     */
    hasActiveSessions() {
        return false;
    }
    shouldAutoConnect() {
        if (!this.autoReconnect || !!this.connectAction)
            return false;
        // if we're mid-disconnect, don't auto-reconnect
        if (this.disconnectAction?.hookMessageId)
            return false;
        if (!this.lastDisconnectDate)
            return true;
        const reconnectMillis = this.constructor
            .MinimumAutoReconnectMillis;
        if (Number.isNaN(reconnectMillis))
            return false;
        return Date.now() - this.lastDisconnectDate.getTime() >= reconnectMillis;
    }
    onMessage(payload) {
        if ('responseId' in payload) {
            this.onResponse(payload);
        }
        else if ('listenerId' in payload || 'eventType' in payload) {
            this.onEvent(payload);
        }
    }
    onResponse(message) {
        const id = message.responseId;
        if (message.data instanceof Error) {
            let responseError = message.data;
            const isDisconnected = !!this.disconnectAction ||
                responseError.name === SessionClosedOrMissingError_1.default.name ||
                responseError.isDisconnecting === true;
            delete responseError.isDisconnecting;
            if (isDisconnected && !isBrowserLaunchError(responseError)) {
                responseError = new DisconnectedError_1.default(this.transport.host);
            }
            this.pendingMessages.reject(id, responseError);
        }
        else {
            this.pendingMessages.resolve(id, message.data);
        }
    }
    onEvent(event) {
        this.emit('event', { event });
    }
    async onConnectionTerminated() {
        if (this.didCallConnectionTerminated)
            return;
        this.lastDisconnectDate = new Date();
        this.didCallConnectionTerminated = true;
        this.emit('disconnected');
        // clear all pending messages
        if (this.connectAction?.hookMessageId) {
            this.onResponse({
                responseId: this.connectAction.hookMessageId,
                data: !this.connectAction.isAutomatic ? new DisconnectedError_1.default(this.transport.host) : null,
            });
        }
        this.connectAction = null;
        if (this.disconnectAction?.hookMessageId) {
            this.onResponse({
                responseId: this.disconnectAction.hookMessageId,
                data: null,
            });
        }
        this.pendingMessages.cancel(new DisconnectedError_1.default(this.transport.host));
        await this.hooks.afterDisconnectHook?.();
    }
    async afterConnectHook() {
        if (this.disconnectAction)
            return;
        const connectAction = this.connectAction;
        if (!connectAction)
            return;
        // don't run this if we're already connected
        if (connectAction.resolvable.isResolved)
            return;
        try {
            connectAction.isCallingHook = true;
            await this.hooks.afterConnectFn?.(connectAction);
        }
        finally {
            connectAction.isCallingHook = false;
        }
    }
    async beforeDisconnectHook() {
        const disconnectAction = this.disconnectAction;
        if (!disconnectAction)
            return;
        try {
            disconnectAction.isCallingHook = true;
            await this.hooks.beforeDisconnectFn?.(disconnectAction);
        }
        catch (err) {
            log.error('Error in beforeDisconnect hook', {
                sessionId: null,
                error: err,
            });
        }
        finally {
            disconnectAction.isCallingHook = false;
        }
    }
}
ConnectionToCore.MinimumAutoReconnectMillis = 1000;
exports.default = ConnectionToCore;
function isBrowserLaunchError(error) {
    return error.name === 'BrowserLaunchError' || error.name === 'DependenciesMissingError';
}
//# sourceMappingURL=ConnectionToCore.js.map