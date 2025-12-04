"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const CoreCommandQueue_1 = require("./CoreCommandQueue");
const CoreEventHeap_1 = require("./CoreEventHeap");
const CoreTab_1 = require("./CoreTab");
const CoreKeepAlivePrompt_1 = require("./CoreKeepAlivePrompt");
class CoreSession extends eventUtils_1.TypedEventEmitter {
    get lastCommandId() {
        return this.commandId;
    }
    get nextCommandId() {
        this.commandId += 1;
        return this.commandId;
    }
    get firstTab() {
        return [...this.tabsById.values()][0];
    }
    constructor(sessionMeta, connectionToCore, options, callsiteLocator) {
        super();
        this.tabsById = new Map();
        this.emitter = new events_1.EventEmitter();
        this.commandId = 0;
        this.isClosing = false;
        const { sessionName, mode } = options;
        this.mode = mode;
        const { sessionId } = sessionMeta;
        this.sessionId = sessionId;
        this.sessionName = sessionName;
        this.callsiteLocator = callsiteLocator;
        this.meta = {
            sessionId,
        };
        this.connectionToCore = connectionToCore;
        Logger_1.loggerSessionIdNames.set(sessionId, sessionName);
        this.commandQueue = new CoreCommandQueue_1.default({ sessionId, sessionName }, connectionToCore, this, this.callsiteLocator);
        this.eventHeap = new CoreEventHeap_1.default(this.meta, connectionToCore, this, this.callsiteLocator);
        this.addTab(sessionMeta);
    }
    onEvent(meta, listenerId, eventData, lastCommandId) {
        if (lastCommandId && lastCommandId > this.commandId) {
            this.commandId = lastCommandId;
        }
        if (meta.tabId) {
            const coreTab = this.tabsById.get(meta.tabId);
            coreTab?.eventHeap?.incomingEvent(meta, listenerId, eventData);
        }
        else {
            this.eventHeap.incomingEvent(meta, listenerId, eventData);
        }
    }
    getHeroMeta() {
        return this.commandQueue.run('Session.getHeroMeta');
    }
    async newTab() {
        const meta = await this.commandQueue.run('Session.newTab');
        return this.addTab(meta);
    }
    async getTabs() {
        const tabSessionMetas = await this.commandQueue.run('Session.getTabs');
        for (const tabMeta of tabSessionMetas) {
            this.addTab(tabMeta);
        }
        return [...this.tabsById.values()];
    }
    addTab(tabMeta) {
        if (!this.tabsById.has(tabMeta.tabId)) {
            this.tabsById.set(tabMeta.tabId, new CoreTab_1.default({ ...tabMeta, sessionName: this.sessionName }, this.connectionToCore, this));
        }
        return this.tabsById.get(tabMeta.tabId);
    }
    removeTab(tab) {
        this.tabsById.delete(tab.tabId);
    }
    // START OF PRIVATE APIS FOR DATASTORE /////////////////////////////////////////////////////////////
    recordOutput(changes) {
        for (const change of changes) {
            change.lastCommandId = this.lastCommandId;
        }
        this.commandQueue.record({ command: 'Session.recordOutput', args: changes });
    }
    async setSnippet(key, value) {
        await this.commandQueue.run('Session.setSnippet', key, value, Date.now());
    }
    async getCollectedAssetNames(sessionId) {
        return await this.commandQueue.run('Session.getCollectedAssetNames', sessionId);
    }
    async getSnippets(sessionId, name) {
        return await this.commandQueue.run('Session.getSnippets', sessionId, name);
    }
    async getDetachedElements(sessionId, name) {
        return await this.commandQueue.run('Session.getDetachedElements', sessionId, name);
    }
    async getDetachedResources(sessionId, name) {
        return await this.commandQueue.run('Session.getDetachedResources', sessionId, name);
    }
    // END OF PRIVATE APIS FOR DATASTORE ///////////////////////////////////////////////////////////////
    async close(force = false) {
        await this.closingPromise;
        if (this.isClosing)
            return;
        try {
            this.isClosing = true;
            this.closeCliPrompt();
            this.closingPromise = this.doClose(force);
            const result = await this.closingPromise;
            this.closingPromise = null;
            if (result?.didKeepAlive === true) {
                this.isClosing = false;
                const didClose = new Promise(resolve => this.addEventListener(null, 'close', resolve));
                await this.watchRelaunchLogs();
                this.keepAlivePrompt = new CoreKeepAlivePrompt_1.default(result.message, this.close.bind(this, true));
                await didClose;
            }
        }
        finally {
            this.emit('close');
            Logger_1.loggerSessionIdNames.delete(this.sessionId);
        }
    }
    async addEventListener(jsPath, eventType, listenerFn, options) {
        if (eventType === 'command') {
            this.emitter.on(eventType, listenerFn);
        }
        else {
            await this.eventHeap.addListener(jsPath, eventType, listenerFn, options);
        }
    }
    async removeEventListener(jsPath, eventType, listenerFn) {
        if (eventType === 'command') {
            this.emitter.off(eventType, listenerFn);
        }
        else {
            await this.eventHeap.removeListener(jsPath, eventType, listenerFn);
        }
    }
    async pause() {
        await this.commandQueue.run('Session.pauseCommands');
    }
    async doClose(force) {
        await this.commandQueue.flush();
        for (const tab of this.tabsById.values()) {
            await tab.flush();
        }
        return await this.commandQueue.runOutOfBand('Session.close', force);
    }
    closeCliPrompt() {
        if (this.keepAlivePrompt) {
            this.keepAlivePrompt.close();
            this.keepAlivePrompt = null;
        }
    }
    async watchRelaunchLogs() {
        await this.addEventListener(null, 'rerun-stdout', msg => process.stdout.write(msg));
        await this.addEventListener(null, 'rerun-stderr', msg => process.stderr.write(msg));
        await this.addEventListener(null, 'rerun-kept-alive', () => {
            if (!this.keepAlivePrompt)
                return;
            // eslint-disable-next-line no-console
            console.log(this.keepAlivePrompt.message);
        });
    }
}
exports.default = CoreSession;
(0, addGlobalInstance_1.default)(CoreSession);
//# sourceMappingURL=CoreSession.js.map