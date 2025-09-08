"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const CoreCommandQueue_1 = require("./CoreCommandQueue");
const CoreEventHeap_1 = require("./CoreEventHeap");
const Resource_1 = require("./Resource");
const CoreFrameEnvironment_1 = require("./CoreFrameEnvironment");
const Dialog_1 = require("./Dialog");
const DomStateHandler_1 = require("./DomStateHandler");
const FlowCommands_1 = require("./FlowCommands");
class CoreTab {
    get mainFrameEnvironment() {
        return this.frameEnvironmentsById.get(this.mainFrameId);
    }
    constructor(meta, connection, coreSession) {
        this.frameEnvironmentsById = new Map();
        this.flowCommands = new FlowCommands_1.default(this);
        this.flowHandlers = [];
        const { tabId, sessionId, frameId, sessionName } = meta;
        this.tabId = tabId;
        this.sessionId = sessionId;
        this.mainFrameId = frameId;
        this.meta = {
            sessionId,
            tabId,
            sessionName,
        };
        this.connection = connection;
        this.commandQueue = new CoreCommandQueue_1.default(this.meta, connection, coreSession, coreSession.callsiteLocator);
        this.commandQueue.registerCommandRetryHandlerFn(this.shouldRetryFlowHandlers.bind(this));
        this.coreSession = coreSession;
        this.eventHeap = new CoreEventHeap_1.default(this.meta, connection, coreSession, coreSession.callsiteLocator);
        this.frameEnvironmentsById.set(frameId, new CoreFrameEnvironment_1.default(this, meta, null));
        const resolvedThis = Promise.resolve(this);
        this.eventHeap.registerEventInterceptors({
            resource: Resource_1.createResource.bind(null, resolvedThis),
            dialog: Dialog_1.createDialog.bind(null, resolvedThis),
        });
    }
    async waitForState(state, options = { timeoutMs: 30e3 }, sourceCode) {
        const callstack = sourceCode?.callstack ?? new Error().stack.slice(8);
        const callsitePath = sourceCode?.callsitePath ?? this.coreSession.callsiteLocator.getCurrent();
        if (typeof state === 'function') {
            state = { all: state };
        }
        const handler = new DomStateHandler_1.default(state, null, this, callsitePath, {
            flowCommand: this.flowCommands.runningFlowCommand,
        });
        try {
            await handler.waitFor(options.timeoutMs);
        }
        catch (error) {
            if (!error.stack.includes(callstack))
                error.stack += `\n${callstack}`;
            this.commandQueue.decorateErrorStack(error, callsitePath);
            if (!(error instanceof TimeoutError_1.default))
                throw error;
            // Retry state after each flow handler, but do not retry the timeout
            for (let i = 0; i < CoreCommandQueue_1.default.maxCommandRetries; i += 1) {
                this.commandQueue.retryingCommand = {
                    command: CoreTab.waitForStateCommandPlaceholder,
                    retryNumber: i,
                };
                const { triggeredFlowHandler } = await this.triggerFlowHandlers();
                if (!triggeredFlowHandler)
                    break;
                if (this.flowCommands.isRunning)
                    throw error;
                const didPass = await handler.check(true);
                if (didPass)
                    return;
            }
            throw error;
        }
    }
    async validateState(state, callsitePath) {
        if (typeof state === 'function') {
            state = { all: state };
        }
        const handler = new DomStateHandler_1.default(state, null, this, callsitePath);
        return await handler.check();
    }
    async registerFlowHandler(name, state, handlerFn, callsitePath) {
        const id = this.flowHandlers.length + 1;
        if (typeof state === 'function') {
            state = { all: state };
        }
        this.flowHandlers.push({ id, name, state, callsitePath, handlerFn });
        await this.commandQueue.runOutOfBand('Tab.registerFlowHandler', name, id, callsitePath);
    }
    async runFlowCommand(commandFn, exitState, callsitePath, options) {
        if (typeof exitState === 'function') {
            exitState = { all: exitState };
        }
        const startStack = new Error('').stack.slice(8);
        const flowCommand = await this.flowCommands.create(commandFn, exitState, callsitePath, options);
        try {
            return await flowCommand.run();
        }
        catch (error) {
            const startingTrace = `${'------FLOW COMMAND'.padEnd(50, '-')}\n${startStack}`;
            if (!error.stack.includes(startStack.split(/\r?\n/g).pop())) {
                this.commandQueue.appendTrace(error, startingTrace);
            }
            throw error;
        }
    }
    async shouldRetryFlowHandlers(command, error) {
        if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
            return false;
        if (
        // NOTE: waitForState is also handled in it's own fn
        command?.command === 'FrameEnvironment.execJsPath' ||
            command?.command === 'FrameEnvironment.interact' ||
            command?.command === CoreTab.waitForStateCommandPlaceholder) {
            const { triggeredFlowHandler } = await this.triggerFlowHandlers();
            return triggeredFlowHandler !== undefined;
        }
        return false;
    }
    async triggerFlowHandlers() {
        const matchingStates = [];
        await Promise.all(this.flowHandlers.map(async (flowHandler) => {
            const handler = new DomStateHandler_1.default(flowHandler.state, null, this, flowHandler.callsitePath, { flowHandlerId: flowHandler.id });
            try {
                if (await handler.check()) {
                    matchingStates.push(flowHandler);
                }
            }
            catch (err) {
                await flowHandler.handlerFn(err);
            }
        }));
        if (!matchingStates.length)
            return { matchedFlowHandlers: matchingStates };
        try {
            const flowHandler = matchingStates[0];
            this.flowCommands.didRunFlowHandlers();
            this.commandQueue.setCommandMetadata({ activeFlowHandlerId: flowHandler.id });
            await flowHandler.handlerFn();
            return { triggeredFlowHandler: flowHandler, matchedFlowHandlers: matchingStates };
        }
        finally {
            this.commandQueue.setCommandMetadata({ activeFlowHandlerId: undefined });
        }
    }
    async getCoreFrameEnvironments() {
        const frameMetas = await this.commandQueue.run('Tab.getFrameEnvironments');
        for (const frameMeta of frameMetas) {
            this.getCoreFrameForMeta(frameMeta);
        }
        return [...this.frameEnvironmentsById.values()];
    }
    getCoreFrameForMeta(frameMeta) {
        if (!this.frameEnvironmentsById.has(frameMeta.id)) {
            const meta = { ...this.meta };
            meta.frameId = frameMeta.id;
            this.frameEnvironmentsById.set(frameMeta.id, new CoreFrameEnvironment_1.default(this, meta, frameMeta.parentFrameId));
        }
        return this.frameEnvironmentsById.get(frameMeta.id);
    }
    async getResourceProperty(id, propertyPath) {
        return await this.commandQueue.runOutOfBand('Tab.getResourceProperty', id, propertyPath);
    }
    async configure(options) {
        await this.commandQueue.run('Tab.configure', options);
    }
    async detachResource(name, resourceId) {
        return await this.commandQueue.run('Tab.detachResource', name, resourceId, Date.now());
    }
    async goto(href, options) {
        return await this.commandQueue.run('Tab.goto', href, options);
    }
    async goBack(options) {
        return await this.commandQueue.run('Tab.goBack', options);
    }
    async goForward(options) {
        return await this.commandQueue.run('Tab.goForward', options);
    }
    async findResource(filter, options) {
        return await this.commandQueue.run('Tab.findResource', filter, options);
    }
    async findResources(filter, options) {
        return await this.commandQueue.run('Tab.findResources', filter, options);
    }
    async reload(options) {
        return await this.commandQueue.run('Tab.reload', options);
    }
    async exportUserProfile() {
        return await this.commandQueue.run('Session.exportUserProfile');
    }
    async takeScreenshot(options) {
        return await this.commandQueue.run('Tab.takeScreenshot', options);
    }
    async waitForFileChooser(options) {
        return await this.commandQueue.run('Tab.waitForFileChooser', options);
    }
    async waitForResources(filter, opts) {
        return await this.commandQueue.run('Tab.waitForResources', filter, opts);
    }
    async waitForMillis(millis) {
        await this.commandQueue.run('Tab.waitForMillis', millis);
    }
    async waitForNewTab(opts) {
        const sessionMeta = await this.commandQueue.run('Tab.waitForNewTab', opts);
        const session = this.connection.getSession(sessionMeta.sessionId);
        return session.addTab(sessionMeta);
    }
    async focusTab() {
        await this.commandQueue.run('Tab.focus');
    }
    async dismissDialog(accept, promptText) {
        await this.commandQueue.runOutOfBand('Tab.dismissDialog', accept, promptText);
    }
    async addEventListener(jsPath, eventType, listenerFn, options, extras) {
        if (this.commandQueue.commandMetadata) {
            extras ??= {};
            Object.assign(extras, this.commandQueue.commandMetadata);
        }
        await this.eventHeap.addListener(jsPath, eventType, listenerFn, options, extras);
    }
    async removeEventListener(jsPath, eventType, listenerFn, options, extras) {
        if (this.commandQueue.commandMetadata) {
            extras ??= {};
            Object.assign(extras, this.commandQueue.commandMetadata);
        }
        await this.eventHeap.removeListener(jsPath, eventType, listenerFn, options, extras);
    }
    async flush() {
        for (const frame of this.frameEnvironmentsById.values()) {
            await frame.commandQueue.flush();
        }
        await this.commandQueue.flush();
    }
    async close() {
        await this.flush();
        await this.commandQueue.run('Tab.close');
        const session = this.connection.getSession(this.sessionId);
        session?.removeTab(this);
    }
}
CoreTab.waitForStateCommandPlaceholder = 'waitForState';
exports.default = CoreTab;
//# sourceMappingURL=CoreTab.js.map