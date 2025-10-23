"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const VersionUtils_1 = require("@ulixee/commons/lib/VersionUtils");
const EmittingTransportToClient_1 = require("@ulixee/net/lib/EmittingTransportToClient");
const BrowserLaunchError_1 = require("@ulixee/unblocked-agent/errors/BrowserLaunchError");
const CommandRunner_1 = require("../lib/CommandRunner");
const FrameEnvironment_1 = require("../lib/FrameEnvironment");
const RemoteEvents_1 = require("../lib/RemoteEvents");
const Session_1 = require("../lib/Session");
const Tab_1 = require("../lib/Tab");
const { version } = require('../package.json');
const { log } = (0, Logger_1.default)(module);
class ConnectionToHeroClient extends eventUtils_1.TypedEventEmitter {
    get autoShutdownMillis() {
        return this.core?.clearIdleConnectionsAfterMillis ?? 0;
    }
    constructor(transport, core) {
        super();
        this.transport = transport;
        this.core = core;
        this.sessionIdToRemoteEvents = new Map();
        this.activeCommandMessageIds = new Set();
        transport.on('message', message => this.handleRequest(message));
        transport.once('disconnected', error => this.disconnect(error));
        this.sendEvent = this.sendEvent.bind(this);
        this.checkForAutoShutdown = this.checkForAutoShutdown.bind(this);
        this.disconnectIfInactive = this.disconnectIfInactive.bind(this);
    }
    ///////  CORE CONNECTION  /////////////////////////////////////////////////////////////////////////////////////
    async handleRequest(payload) {
        const { messageId, command, meta, recordCommands, ...nextCommandMeta } = payload;
        const session = meta?.sessionId ? Session_1.default.get(meta.sessionId) : undefined;
        // json converts args to null which breaks undefined argument handlers
        const args = payload.args.map(x => (x === null ? undefined : x));
        let data;
        try {
            this.activeCommandMessageIds.add(messageId);
            if (recordCommands)
                await this.recordCommands(meta, payload.sendTime, recordCommands);
            data = await this.executeCommand(command, args, meta, nextCommandMeta);
            // make sure to get tab metadata
            data = this.serializeToMetadata(data);
        }
        catch (error) {
            const isClosing = session?.isClosing || !!this.disconnectPromise;
            // if we're closing, don't emit errors
            let shouldSkipLogging = isClosing && error instanceof IPendingWaitEvent_1.CanceledPromiseError;
            // don't log timeouts when explicitly provided timeout (NOTE: doesn't cover goto)
            if (args && error instanceof TimeoutError_1.default) {
                for (const arg of args) {
                    if (arg && !Number.isNaN(arg.timeoutMs)) {
                        shouldSkipLogging = true;
                    }
                }
            }
            const isLaunchError = this.isLaunchError(error);
            const isDirect = this.transport instanceof EmittingTransportToClient_1.default;
            if ((isDirect === false && shouldSkipLogging === false) || isLaunchError) {
                log.error('ConnectionToClient.HandleRequestError', {
                    error,
                    sessionId: meta?.sessionId,
                });
            }
            data = this.serializeError(error);
            data.isDisconnecting = isClosing;
        }
        finally {
            this.activeCommandMessageIds.delete(messageId);
        }
        const response = {
            responseId: messageId,
            data,
        };
        try {
            await this.transport.send(response);
        }
        catch (err) {
            if (err instanceof IPendingWaitEvent_1.CanceledPromiseError || String(err).includes('Websocket was not open'))
                return;
            throw err;
        }
    }
    async connect(options = {}) {
        if (options.version) {
            if (!(0, VersionUtils_1.isSemverSatisfied)(options.version, version)) {
                throw new Error(`This Hero Core (version=${version}) cannot satisfy the requested version (${options.version}).`);
            }
        }
        if (options.maxConcurrentClientCount &&
            options.maxConcurrentClientCount < this.core.pool.maxConcurrentAgents) {
            this.core.pool.maxConcurrentAgents = options.maxConcurrentClientCount;
        }
        this.disconnectPromise = null;
        await this.core.start();
        return {
            maxConcurrency: this.core.pool.maxConcurrentAgents,
        };
    }
    logUnhandledError(error, fatalError = false) {
        if (fatalError) {
            log.error('ConnectionToClient.UnhandledError(fatal)', {
                clientError: error,
                sessionId: null,
            });
        }
        else {
            log.error('ConnectionToClient.UnhandledErrorOrRejection', {
                clientError: error,
                sessionId: null,
            });
        }
    }
    async disconnect(fatalError) {
        if (this.disconnectPromise)
            return this.disconnectPromise;
        const resolvable = new Resolvable_1.default();
        this.disconnectPromise = resolvable.promise;
        try {
            const logId = log.stats('ConnectionToClient.Disconnecting', { sessionId: null, fatalError });
            clearTimeout(this.autoShutdownTimer);
            const closeAll = [];
            for (const id of this.sessionIdToRemoteEvents.keys()) {
                const session = Session_1.default.get(id);
                if (session)
                    closeAll.push(session.close(true).catch(err => err));
            }
            await Promise.all([...closeAll, this.transport.disconnect?.(fatalError)]);
            this.emit('disconnected', fatalError);
            log.stats('ConnectionToClient.Disconnected', { sessionId: null, parentLogId: logId });
        }
        finally {
            resolvable.resolve();
            this.core = null;
        }
    }
    isActive() {
        return this.sessionIdToRemoteEvents.size > 0 || this.activeCommandMessageIds.size > 0;
    }
    isAllowedCommand(method) {
        return (method === 'connect' ||
            method === 'disconnect' ||
            method === 'logUnhandledError' ||
            method === 'createSession');
    }
    sendEvent(message) {
        void this.transport
            .send(message)
            .catch(error => log.error('ERROR sending message', { error, message, sessionId: null }));
    }
    ///////  SESSION /////////////////////////////////////////////////////////////////////////////////////////////////////
    async createSession(options = {}) {
        if (this.disconnectPromise)
            throw new Error('Connection closed');
        clearTimeout(this.autoShutdownTimer);
        const { session, tab } = await Session_1.default.create(options, this.core);
        const sessionId = session.id;
        if (!this.sessionIdToRemoteEvents.has(sessionId)) {
            const remoteEvents = new RemoteEvents_1.default(session, this.sendEvent);
            this.sessionIdToRemoteEvents.set(sessionId, remoteEvents);
            session.once('closing', () => this.sessionIdToRemoteEvents.delete(sessionId));
            session.once('closed', this.checkForAutoShutdown);
        }
        return { tabId: tab?.id, sessionId: session.id, frameId: tab?.mainFrameId };
    }
    /////// INTERNAL FUNCTIONS /////////////////////////////////////////////////////////////////////////////
    async recordCommands(meta, sendTime, recordCommands) {
        if (!recordCommands.length)
            return;
        const promises = [];
        for (const { command, args, commandId, startTime } of recordCommands) {
            const cleanArgs = args.map(x => (x === null ? undefined : x));
            const promise = this.executeCommand(command, cleanArgs, meta, {
                commandId,
                startTime,
                sendTime,
            }).catch(error => {
                log.warn('RecordingCommandsFailed', {
                    sessionId: meta.sessionId,
                    error,
                    command,
                });
            });
            promises.push(promise);
        }
        await Promise.all(promises);
    }
    async executeCommand(command, args, meta, commandMeta) {
        const session = Session_1.default.get(meta?.sessionId);
        const tab = Session_1.default.getTab(meta);
        const frame = tab?.getFrameEnvironment(meta?.frameId);
        const events = this.sessionIdToRemoteEvents.get(meta?.sessionId);
        const commandRunner = new CommandRunner_1.default(command, args, {
            Session: session,
            Events: events?.getEventTarget(meta),
            Core: this,
            Tab: tab,
            FrameEnvironment: frame,
        });
        if (session && commandMeta) {
            session.commands.presetMeta = commandMeta;
        }
        return await commandRunner.runFn();
    }
    disconnectIfInactive() {
        if (this.isActive() || this.autoShutdownMillis <= 0)
            return;
        return this.disconnect();
    }
    checkForAutoShutdown() {
        if (this.autoShutdownMillis <= 0)
            return;
        clearTimeout(this.autoShutdownTimer);
        this.autoShutdownTimer = setTimeout(this.disconnectIfInactive, this.autoShutdownMillis).unref();
    }
    isLaunchError(error) {
        return (error instanceof BrowserLaunchError_1.default ||
            error.name === 'BrowserLaunchError' ||
            error.name === 'DependenciesMissingError');
    }
    serializeToMetadata(data) {
        if (!data || typeof data !== 'object')
            return data;
        if (data instanceof Tab_1.default || data instanceof FrameEnvironment_1.default) {
            return data.toJSON();
        }
        if (Array.isArray(data)) {
            return data.map(x => this.serializeToMetadata(x));
        }
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Tab_1.default || value instanceof FrameEnvironment_1.default)
                data[key] = value.toJSON();
        }
        return data;
    }
    serializeError(error) {
        if (this.isLaunchError(error)) {
            const message = `Ulixee Cloud failed to launch Chrome - ${error.message}. See Cloud console logs for details.`;
            error.stack = error.stack.replace(error.message, message);
            error.message = message;
        }
        if (error instanceof Error)
            return error;
        return new Error(`Unknown error occurred ${error}`);
    }
}
exports.default = ConnectionToHeroClient;
//# sourceMappingURL=ConnectionToHeroClient.js.map