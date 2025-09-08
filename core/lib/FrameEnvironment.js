"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const url_1 = require("url");
const Fs = require("fs");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Os = require("os");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const IDomChangeEvent_1 = require("@ulixee/hero-interfaces/IDomChangeEvent");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const CommandRecorder_1 = require("./CommandRecorder");
const InjectedScripts_1 = require("./InjectedScripts");
const { log } = (0, Logger_1.default)(module);
class FrameEnvironment extends eventUtils_1.TypedEventEmitter {
    get session() {
        return this.tab.session;
    }
    get devtoolsFrameId() {
        return this.frame.id;
    }
    get parentId() {
        return this.parentFrame?.id;
    }
    get parentFrame() {
        if (this.frame.parentId) {
            return this.tab.frameEnvironmentsByDevtoolsId.get(this.frame.parentId);
        }
        return null;
    }
    get isAttached() {
        return this.frame.isAttached;
    }
    get securityOrigin() {
        return this.frame.securityOrigin;
    }
    get childFrameEnvironments() {
        return [...this.tab.frameEnvironmentsById.values()].filter(x => x.frame.parentId === this.devtoolsFrameId && this.isAttached);
    }
    get isMainFrame() {
        return !this.frame.parentId;
    }
    get navigations() {
        return this.frame.navigations;
    }
    get id() {
        return this.frame.frameId;
    }
    get url() {
        return this.navigations.currentUrl;
    }
    constructor(tab, frame) {
        super();
        this.events = new EventSubscriber_1.default();
        this.isClosing = false;
        this.filePathsToClean = [];
        this.lastDomChangeTimestamp = 0;
        this.isTrackingMouse = false;
        this.flushPageEventsRecorderResolvers = new Map();
        this.installedDomAssertions = new Set();
        this.frame = frame;
        this.tab = tab;
        this.createdTime = new Date();
        this.logger = log.createChild(module, {
            tabId: tab.id,
            sessionId: tab.session.id,
            frameId: this.id,
        });
        this.createdAtCommandId = this.session.commands.lastId;
        if (this.session.options.showChromeInteractions) {
            frame.interactor.beforeEachInteractionStep = this.beforeEachInteractionStep.bind(this);
            frame.interactor.afterInteractionGroups = this.afterInteractionGroups.bind(this);
        }
        frame.interactor.afterEachInteractionStep = this.afterEachInteractionStep.bind(this);
        // give tab time to setup
        process.nextTick(() => this.listen());
        this.commandRecorder = new CommandRecorder_1.default(this, tab.session, tab.id, this.id, [
            this.createRequest,
            this.detachElement,
            this.execJsPath,
            this.fetch,
            this.meta,
            this.getChildFrameEnvironment,
            this.getCookies,
            this.getJsValue,
            this.getUrl,
            this.isAllContentLoaded,
            this.isDomContentLoaded,
            this.isPaintingStable,
            this.interact,
            this.removeCookie,
            this.setCookie,
            this.setFileInputFiles,
            this.runPluginCommand,
            this.waitForLoad,
            this.waitForLocation,
            this.addRemoteEventListener,
            this.removeRemoteEventListener,
            // DO NOT ADD waitForReady
        ]);
        // don't let this explode
        this.isReady = this.install().catch(err => err);
    }
    isAllowedCommand(method) {
        return this.commandRecorder.fnNames.has(method) || method === 'close';
    }
    close() {
        if (this.isClosing)
            return;
        this.isClosing = true;
        const parentLogId = this.logger.stats('FrameEnvironment.Closing');
        try {
            this.frame.close();
            this.logger.stats('FrameEnvironment.Closed', { parentLogId });
            for (const path of this.filePathsToClean) {
                Fs.promises.unlink(path).catch(() => null);
            }
            this.events.close();
            this.commandRecorder.cleanup();
        }
        catch (error) {
            if (!error.message.includes('Target closed') && !(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                this.logger.error('FrameEnvironment.ClosingError', { error, parentLogId });
            }
        }
    }
    setInteractionDisplay(followMouseMoves, hideMouse = false, hideHighlightedNodes = false) {
        if (this.isTrackingMouse === followMouseMoves)
            return;
        this.isTrackingMouse = followMouseMoves;
        this.frame
            .evaluate(`window.setInteractionDisplay(${followMouseMoves}, ${hideMouse}, ${hideHighlightedNodes})`)
            .catch(() => null);
    }
    afterInteractionGroups() {
        this.tab.mainFrameEnvironment.setInteractionDisplay(false);
        return Promise.resolve();
    }
    afterEachInteractionStep(interaction, startTime) {
        this.session.db.interactions.insert(this.tab.id, this.id, this.session.commands.lastId, interaction, startTime, Date.now());
        return Promise.resolve();
    }
    async beforeEachInteractionStep(interaction, isMouseCommand) {
        if (this.tab.isClosing) {
            throw new IPendingWaitEvent_1.CanceledPromiseError('Canceling interaction - tab closing');
        }
        await this.tab.session.commands.waitForCommandLock();
        if (isMouseCommand) {
            this.tab.mainFrameEnvironment.setInteractionDisplay(true);
        }
    }
    /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////
    async interact(...interactionGroups) {
        await this.frame.interact(...interactionGroups);
    }
    async getJsValue(expression) {
        return await this.frame.evaluate(expression, { isolateFromWebPageEnvironment: false });
    }
    async execJsPath(jsPath) {
        return await this.frame.jsPath.exec(jsPath);
    }
    meta() {
        return Promise.resolve(this.toJSON());
    }
    async detachElement(name, jsPath, timestamp, waitForElement = false, saveToDb = true) {
        const { nodePointer } = await this.frame.jsPath.getNodePointer(jsPath);
        await this.flushPageEventsRecorder();
        const navigation = this.navigations.lastHttpNavigationRequest;
        const commandId = this.session.commands.lastId;
        const domChangesTimestamp = this.lastDomChangeTimestamp;
        const elements = [];
        if (nodePointer.iterableItems && nodePointer.iterableIsNodePointers) {
            for (const item of nodePointer.iterableItems) {
                elements.push({
                    name,
                    nodePath: this.frame.jsPath.getSourceJsPath(item),
                    documentUrl: this.url,
                    nodePointerId: item.id,
                    frameId: this.id,
                    tabId: this.tab.id,
                    nodeType: item.type,
                    nodePreview: item.preview,
                    frameNavigationId: navigation.id,
                    commandId,
                    domChangesTimestamp,
                    timestamp,
                });
            }
        }
        else if (!nodePointer.iterableItems) {
            elements.push({
                name,
                nodePointerId: nodePointer.id,
                nodePath: this.frame.jsPath.getSourceJsPath(nodePointer),
                documentUrl: this.url,
                frameId: this.id,
                tabId: this.tab.id,
                nodeType: nodePointer.type,
                nodePreview: nodePointer.preview,
                frameNavigationId: navigation.id,
                commandId,
                domChangesTimestamp,
                timestamp,
            });
        }
        const promises = [];
        for (const element of elements) {
            const elementHtmlPromise = this.tab.onElementRequested(element, saveToDb);
            if (waitForElement) {
                promises.push(elementHtmlPromise);
            }
        }
        return waitForElement ? await Promise.all(promises) : elements;
    }
    async createRequest(input, init) {
        if (!this.navigations.top && !this.url) {
            throw new Error('You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.');
        }
        await this.frame.waitForLoad();
        return this.runIsolatedFn(`${InjectedScripts_1.default.Fetcher}.createRequest`, input, 
        // @ts-ignore
        init);
    }
    async fetch(input, init) {
        if (!this.navigations.top && !this.url) {
            throw new Error('You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.');
        }
        await this.frame.waitForLoad();
        return this.runIsolatedFn(`${InjectedScripts_1.default.Fetcher}.fetch`, input, 
        // @ts-ignore
        init);
    }
    getUrl() {
        return Promise.resolve(this.navigations.currentUrl || this.frame.url);
    }
    isPaintingStable() {
        return Promise.resolve(this.navigations.hasLoadStatus(Location_1.LoadStatus.PaintingStable));
    }
    isDomContentLoaded() {
        return Promise.resolve(this.navigations.hasLoadStatus(Location_1.LoadStatus.DomContentLoaded));
    }
    isAllContentLoaded() {
        return Promise.resolve(this.navigations.hasLoadStatus(Location_1.LoadStatus.AllContentLoaded));
    }
    async getCookies() {
        await this.frame.waitForLoad();
        return await this.session.browserContext.getCookies(new url_1.URL(this.frame.securityOrigin ?? this.frame.url));
    }
    async setCookie(name, value, options) {
        if (!this.navigations.top && this.frame.url === 'about:blank') {
            throw new Error(`Chrome won't allow you to set cookies on a blank tab.

Hero supports two options to set cookies:
a) Goto a url first and then set cookies on the activeTab
b) Use the UserProfile feature to set cookies for 1 or more domains before they're loaded (https://ulixee.org/docs/advanced/user-profile)
      `);
        }
        await this.frame.waitForLoad();
        const url = this.navigations.currentUrl;
        await this.session.browserContext.addCookies([
            {
                name,
                value,
                url,
                ...options,
            },
        ]);
        return true;
    }
    async removeCookie(name) {
        const cookies = await this.getCookies();
        for (const cookie of cookies) {
            if (name === cookie.name) {
                await this.session.browserContext.addCookies([
                    {
                        name,
                        value: '',
                        expires: 0,
                        domain: cookie.domain,
                    },
                ]);
                await new Promise(setImmediate);
                return true;
            }
        }
        await this.session.browserContext.addCookies([
            {
                name,
                value: '',
                expires: 0,
                url: this.frame.url,
            },
        ]);
        await new Promise(setImmediate);
        return true;
    }
    async getChildFrameEnvironment(jsPath) {
        await this.frame.waitForLoad();
        const nodeId = await this.frame.jsPath.getNodePointerId(jsPath);
        if (!nodeId)
            return null;
        for (const frame of this.childFrameEnvironments) {
            if (!frame.isAttached)
                continue;
            await frame.isReady;
            if (frame.domNodeId === nodeId) {
                return frame.toJSON();
            }
        }
    }
    async runDomAssertions(id, assertions) {
        if (!this.installedDomAssertions.has(id)) {
            await this.runIsolatedFn('HERO.DomAssertions.install', id, assertions);
            this.installedDomAssertions.add(id);
        }
        try {
            const { failedIndices } = await this.runIsolatedFn('HERO.DomAssertions.run', id);
            return Object.keys(failedIndices).length;
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return 0;
            if (String(error).includes('This assertion batch has not been installed')) {
                this.installedDomAssertions.delete(id);
                return this.runDomAssertions(id, assertions);
            }
            return 1;
        }
    }
    async clearDomAssertions(id) {
        if (this.installedDomAssertions.has(id)) {
            this.installedDomAssertions.delete(id);
            await this.runIsolatedFn('HERO.DomAssertions.clear', id);
        }
    }
    async runPluginCommand(toPluginId, args) {
        const commandMeta = {
            page: this.tab.page,
            frame: this.frame,
        };
        return await this.session.plugins.onPluginCommand(toPluginId, commandMeta, args);
    }
    async waitForLoad(status, options = {}) {
        await this.isReady;
        return this.frame.waitForLoad({ loadStatus: status, ...options });
    }
    async waitForLocation(trigger, options) {
        const location = await this.frame.waitForLocation(trigger, options);
        const resourceId = location.resourceId ?? (await location.resourceIdResolvable.promise);
        return this.session.resources.get(resourceId);
    }
    async flushPageEventsRecorder() {
        const id = Math.random().toString();
        const resolver = new Resolvable_1.default();
        this.flushPageEventsRecorderResolvers.set(id, resolver);
        this.frame
            .evaluate(`window.flushPageRecorder('${id}')`, {
            isolateFromWebPageEnvironment: true,
        })
            .catch(() => undefined);
        return resolver.promise;
    }
    async onShadowDomPushed(payload) {
        try {
            await this.frame.evaluate(`window.checkForShadowRoot(${payload})`, {
                isolateFromWebPageEnvironment: true,
            });
        }
        catch { }
    }
    onPageRecorderEvents(results) {
        const [domChanges, mouseEvents, focusEvents, scrollEvents, loadEvents, id] = results;
        if (id) {
            this.flushPageEventsRecorderResolvers.get(id)?.resolve();
            this.flushPageEventsRecorderResolvers.delete(id);
        }
        const hasRecords = results.some(x => x.length > 0);
        if (!hasRecords)
            return false;
        const commands = this.session.commands;
        const tabId = this.tab.id;
        const frameId = this.id;
        this.logger.stats('FrameEnvironment.onPageEvents', {
            tabId,
            frameId,
            dom: domChanges.length,
            mouse: mouseEvents.length,
            focusEvents: focusEvents.length,
            scrollEvents: scrollEvents.length,
            loadEvents,
        });
        if (domChanges.length) {
            this.emit('paint');
        }
        let lastCommand = commands.last;
        if (!lastCommand)
            return; // nothing to store yet
        let documentNavigation = this.navigations.get(this.lastDomChangeDocumentNavigationId);
        const db = this.session.db;
        const records = {
            mouseEvents: [],
            focusEvents: [],
            scrollEvents: [],
            domChanges: [],
        };
        for (const domChange of domChanges) {
            const [action, nodeData, timestamp] = domChange;
            lastCommand = commands.getCommandForTimestamp(lastCommand, timestamp);
            if (timestamp > this.lastDomChangeTimestamp)
                this.lastDomChangeTimestamp = timestamp;
            if (action === IDomChangeEvent_1.DomActionType.newDocument || action === IDomChangeEvent_1.DomActionType.location) {
                const url = domChange[1].textContent;
                documentNavigation = this.navigations.findMostRecentHistory(x => x.finalUrl === url);
                if (documentNavigation) {
                    if (action === IDomChangeEvent_1.DomActionType.location && documentNavigation.initiatedTime < timestamp) {
                        this.frame.navigations.adjustInPageLocationChangeTime(documentNavigation, timestamp);
                    }
                    if (action === IDomChangeEvent_1.DomActionType.newDocument &&
                        documentNavigation.id > (this.lastDomChangeDocumentNavigationId ?? 0)) {
                        this.lastDomChangeDocumentNavigationId = documentNavigation.id;
                    }
                }
            }
            // if this is a doctype, set into the navigation
            if (documentNavigation && action === IDomChangeEvent_1.DomActionType.added && nodeData.nodeType === 10) {
                documentNavigation.doctype = nodeData.textContent;
                db.frameNavigations.insert(documentNavigation);
            }
            const record = db.domChanges.insert(tabId, frameId, documentNavigation?.id, lastCommand.id, domChange);
            records.domChanges.push(record);
        }
        for (const mouseEvent of mouseEvents) {
            lastCommand = commands.getCommandForTimestamp(lastCommand, mouseEvent[8]);
            const record = db.mouseEvents.insert(tabId, frameId, lastCommand.id, mouseEvent);
            records.mouseEvents.push(record);
        }
        for (const focusEvent of focusEvents) {
            lastCommand = commands.getCommandForTimestamp(lastCommand, focusEvent[3]);
            const record = db.focusEvents.insert(tabId, frameId, lastCommand.id, focusEvent);
            records.focusEvents.push(record);
        }
        for (const scrollEvent of scrollEvents) {
            lastCommand = commands.getCommandForTimestamp(lastCommand, scrollEvent[2]);
            const record = db.scrollEvents.insert(tabId, frameId, lastCommand.id, scrollEvent);
            records.scrollEvents.push(record);
        }
        this.tab.emit('page-events', { records, frame: this });
        return true;
    }
    /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////
    toJSON() {
        return {
            id: this.id,
            parentFrameId: this.parentId,
            name: this.frame.name,
            tabId: this.tab.id,
            puppetId: this.devtoolsFrameId,
            url: this.navigations.currentUrl,
            securityOrigin: this.securityOrigin,
            sessionId: this.session.id,
            createdAtCommandId: this.createdAtCommandId,
        };
    }
    runIsolatedFn(fnName, ...args) {
        const callFn = `${fnName}(${args
            .map(x => {
            if (!x)
                return 'undefined';
            return JSON.stringify(x);
        })
            .join(', ')})`;
        return this.runFn(fnName, callFn);
    }
    async setFileInputFiles(jsPath, files) {
        const tmpDir = await Fs.promises.mkdtemp(`${Os.tmpdir()}/hero-upload`);
        const filepaths = [];
        for (const file of files) {
            const fileName = `${tmpDir}/${file.name}`;
            filepaths.push(fileName);
            await Fs.promises.writeFile(fileName, file.data);
        }
        await this.frame.setFileInputFiles(jsPath[0], filepaths);
        this.filePathsToClean.push(tmpDir);
    }
    addRemoteEventListener(type, emitFn, jsPath) {
        const details = this.session.commands.observeRemoteEvents(type, emitFn, jsPath, this.tab.id, this.id);
        this.on(type, details.listenFn);
        return Promise.resolve({ listenerId: details.id });
    }
    removeRemoteEventListener(listenerId) {
        const details = this.session.commands.getRemoteEventListener(listenerId);
        this.off(details.type, details.listenFn);
        return Promise.resolve();
    }
    async runFn(fnName, serializedFn) {
        const result = await this.frame.evaluate(serializedFn, {
            isolateFromWebPageEnvironment: true,
        });
        if (result?.error) {
            this.logger.error(fnName, { result });
            throw new Error(result.error);
        }
        else {
            return result;
        }
    }
    async install() {
        try {
            if (!this.isMainFrame) {
                // retrieve the domNode containing this frame (note: valid id only in the containing frame)
                this.domNodeId = await this.frame.getFrameElementNodePointerId();
            }
        }
        catch (error) {
            // This can happen if the node goes away. Still want to record frame
            this.logger.warn('FrameCreated.getDomNodeIdError', {
                error,
                frameId: this.id,
            });
        }
        this.record();
    }
    listen() {
        const frame = this.frame;
        this.events.on(frame, 'frame-navigated', this.onFrameNavigated.bind(this), true);
        this.events.on(frame.navigations, 'change', this.recordNavigationChange.bind(this));
    }
    onFrameNavigated(event) {
        const { navigatedInDocument } = event;
        if (!navigatedInDocument) {
            this.installedDomAssertions.clear();
        }
        this.record();
    }
    recordNavigationChange(event) {
        this.session.db.frameNavigations.insert(event.navigation);
    }
    record() {
        this.session.db.frames.insert({
            ...this.toJSON(),
            domNodeId: this.domNodeId,
            parentId: this.parentId,
            devtoolsFrameId: this.devtoolsFrameId,
            startCommandId: this.createdAtCommandId,
            createdTimestamp: this.createdTime.getTime(),
        });
    }
}
exports.default = FrameEnvironment;
//# sourceMappingURL=FrameEnvironment.js.map