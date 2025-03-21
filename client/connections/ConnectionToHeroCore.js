"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const net_1 = require("@ulixee/net");
const DisconnectedError_1 = require("@ulixee/net/errors/DisconnectedError");
const CallsiteLocator_1 = require("../lib/CallsiteLocator");
const CoreCommandQueue_1 = require("../lib/CoreCommandQueue");
const CoreSessions_1 = require("../lib/CoreSessions");
const DisconnectedFromCoreError_1 = require("./DisconnectedFromCoreError");
const { log } = (0, Logger_1.default)(module);
class ConnectionToHeroCore extends net_1.ConnectionToCore {
    constructor(transport, options, callsiteLocator) {
        super(transport);
        this.options = options ?? {};
        this.commandQueue = new CoreCommandQueue_1.default(null, this, null, callsiteLocator ?? new CallsiteLocator_1.default());
        this.coreSessions = new CoreSessions_1.default(this, this.options.maxConcurrency, this.options.instanceTimeoutMillis);
        this.hooks.afterConnectFn = this.afterConnect.bind(this);
        this.hooks.beforeDisconnectFn = this.beforeDisconnect.bind(this);
        this.hooks.afterDisconnectHook = this.afterDisconnectHook.bind(this);
    }
    ///////  SESSION FUNCTIONS  //////////////////////////////////////////////////////////////////////////////////////////
    sendRequest(payload, timeoutMs) {
        return super.sendRequest(payload, timeoutMs);
    }
    hasActiveSessions() {
        return this.coreSessions.size > 0;
    }
    async createSession(options, callsiteLocator) {
        try {
            return await this.coreSessions.create(options, callsiteLocator);
        }
        catch (error) {
            if (error instanceof DisconnectedError_1.default && this.disconnectAction)
                return null;
            throw error;
        }
    }
    getSession(sessionId) {
        return this.coreSessions.get(sessionId);
    }
    async logUnhandledError(error) {
        await this.commandQueue.run('Core.logUnhandledError', error);
    }
    async afterConnect(connectAction) {
        const connectOptions = {
            maxConcurrentClientCount: this.options.maxConcurrency,
            maxConcurrentClientsPerBrowser: this.options.maxConcurrency,
            version: this.options.version,
        };
        const connectResult = await this.sendRequest({
            startTime: connectAction.startTime,
            command: 'Core.connect',
            args: [connectOptions],
        });
        if (connectResult) {
            const { maxConcurrency } = connectResult;
            if (maxConcurrency &&
                (!this.options.maxConcurrency || maxConcurrency < this.options.maxConcurrency)) {
                log.info('Overriding max concurrency with Core value', {
                    maxConcurrency,
                    sessionId: null,
                });
                this.coreSessions.concurrency = maxConcurrency;
                this.options.maxConcurrency = maxConcurrency;
            }
        }
    }
    async afterDisconnectHook() {
        this.coreSessions.stop(new DisconnectedFromCoreError_1.default(this.transport.host));
        this.commandQueue.stop(new DisconnectedFromCoreError_1.default(this.transport.host));
    }
    async beforeDisconnect(disconnectAction) {
        const hasSessions = this.coreSessions?.size > 0;
        this.commandQueue.stop(new DisconnectedFromCoreError_1.default(this.transport.host));
        const connectAction = this.connectAction;
        this.coreSessions.stop(!this.transport.isConnected && !connectAction
            ? new Error(`No host connection was established (${this.transport.host})`)
            : new DisconnectedFromCoreError_1.default(this.transport.host));
        if (connectAction && !connectAction?.resolvable.isResolved) {
            if (hasSessions && !connectAction.isAutomatic) {
                connectAction.resolvable.reject(new DisconnectedFromCoreError_1.default(this.transport.host));
            }
            else {
                connectAction.resolvable.resolve();
            }
        }
        if (this.transport.isConnected) {
            await this.sendRequest({
                command: 'Core.disconnect',
                startTime: disconnectAction.startTime,
                args: [disconnectAction.error],
            }, 2e3).catch(err => err);
        }
    }
    onEvent(payload) {
        const { meta, listenerId, data, lastCommandId } = payload;
        const session = this.getSession(meta.sessionId);
        session?.onEvent(meta, listenerId, data, lastCommandId);
        this.emit('event', { event: payload });
    }
    static remote(address) {
        address = ConnectionToHeroCore.resolveHost(address);
        const transport = new net_1.WsTransportToCore(address);
        return new ConnectionToHeroCore(transport);
    }
    static resolveHost(host) {
        if (host.endsWith('/hero'))
            return host;
        if (!host.endsWith('/'))
            host += '/';
        if (!host.endsWith('hero'))
            host += 'hero';
        return host;
    }
}
exports.default = ConnectionToHeroCore;
(0, addGlobalInstance_1.default)(ConnectionToHeroCore);
//# sourceMappingURL=ConnectionToHeroCore.js.map