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
    get isConnectedToTransport() {
        return this.transport.isConnected && this.connectPromise?.isResolved;
    }
    constructor(transport, skipConnect = false) {
        super();
        this.transport = transport;
        this.didAutoConnect = false;
        this.hooks = {};
        this.pendingMessages = new PendingMessages_1.default();
        this.events = new EventSubscriber_1.default();
        this.isSendingConnect = false;
        this.isSendingDisconnect = false;
        (0, utils_1.bindFunctions)(this);
        this.events.once(transport, 'disconnected', this.onConnectionTerminated.bind(this));
        this.events.on(transport, 'message', this.onMessage.bind(this));
        if (transport.isConnected && skipConnect) {
            this.connectPromise = new Resolvable_1.default();
            this.connectPromise.resolve();
        }
    }
    async connect(isAutoConnect = false, timeoutMs = 30e3) {
        if (!this.connectPromise) {
            this.didAutoConnect = isAutoConnect;
            this.connectStartTime = Date.now();
            this.connectPromise = new Resolvable_1.default();
            try {
                await this.transport.connect?.(timeoutMs);
                // disconnected during connect
                if (this.hasActiveSessions() && !!this.disconnectPromise && !this.didAutoConnect) {
                    throw new DisconnectedError_1.default(this.transport.host, `Disconnecting during initial connection handshake to ${this.transport.host}`);
                }
                // can be resolved if canceled by a disconnect
                if (!this.connectPromise.isResolved && this.hooks.afterConnectFn) {
                    this.isSendingConnect = true;
                    await this.hooks.afterConnectFn();
                    this.isSendingConnect = false;
                }
                this.connectPromise.resolve();
                this.emit('connected');
                this.transport.isConnected = true;
                this.transport.emit('connected');
            }
            catch (err) {
                this.connectPromise.reject(err, true);
            }
        }
        return this.connectPromise.promise;
    }
    async disconnect(fatalError) {
        // user triggered disconnect sends a disconnect to Core
        this.disconnectStartTime = Date.now();
        this.disconnectError = fatalError;
        if (this.disconnectPromise)
            return this.disconnectPromise;
        const resolvable = new Resolvable_1.default();
        this.disconnectPromise = resolvable.promise;
        try {
            const logid = log.stats('ConnectionToCore.Disconnecting', {
                host: this.transport.host,
                sessionId: null,
            });
            this.pendingMessages.cancel(new DisconnectedError_1.default(this.transport.host));
            this.isSendingDisconnect = true;
            await this.hooks.beforeDisconnectFn?.();
            this.isSendingDisconnect = false;
            await this.transport.disconnect?.();
            this.transport.isConnected = false;
            this.transport.emit('disconnected');
            this.emit('disconnected');
            log.stats('ConnectionToCore.Disconnected', {
                parentLogId: logid,
                host: this.transport.host,
                sessionId: null,
            });
            this.connectPromise = null;
        }
        finally {
            resolvable.resolve();
        }
        return this.disconnectPromise;
    }
    async sendRequest(payload, timeoutMs) {
        const isConnect = this.isSendingConnect;
        const isDisconnect = this.isSendingDisconnect;
        if (!isConnect && !isDisconnect) {
            await this.connect();
        }
        const { promise, id } = this.pendingMessages.create(timeoutMs, isConnect || isDisconnect);
        if (isConnect)
            this.connectMessageId = id;
        if (isDisconnect)
            this.disconnectMessageId = id;
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
            if (this.disconnectPromise && error instanceof IPendingWaitEvent_1.CanceledPromiseError) {
                return;
            }
            throw error;
        }
        finally {
            if (isConnect)
                this.connectMessageId = null;
            if (isDisconnect)
                this.disconnectMessageId = null;
        }
    }
    /**
     * Override fn to control active sessions
     */
    hasActiveSessions() {
        return false;
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
            const isDisconnected = this.disconnectPromise ||
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
        if (this.isConnectionTerminated)
            return;
        this.isConnectionTerminated = true;
        this.emit('disconnected');
        if (this.connectMessageId) {
            this.onResponse({
                responseId: this.connectMessageId,
                data: !this.didAutoConnect ? new DisconnectedError_1.default(this.transport.host) : null,
            });
        }
        if (this.disconnectMessageId) {
            this.onResponse({
                responseId: this.disconnectMessageId,
                data: null,
            });
        }
        this.pendingMessages.cancel(new DisconnectedError_1.default(this.transport.host));
        this.isSendingDisconnect = true;
        await this.hooks.beforeDisconnectFn?.();
        this.isSendingDisconnect = false;
    }
}
exports.default = ConnectionToCore;
function isBrowserLaunchError(error) {
    return error.name === 'BrowserLaunchError' || error.name === 'DependenciesMissingError';
}
//# sourceMappingURL=ConnectionToCore.js.map