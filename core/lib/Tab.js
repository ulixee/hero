"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToRegex = stringToRegex;
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Timer_1 = require("@ulixee/commons/lib/Timer");
const utils_1 = require("@ulixee/commons/lib/utils");
const DomOverridesBuilder_1 = require("@ulixee/default-browser-emulator/lib/DomOverridesBuilder");
const MirrorNetwork_1 = require("@ulixee/hero-timetravel/lib/MirrorNetwork");
const MirrorPage_1 = require("@ulixee/hero-timetravel/lib/MirrorPage");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const ScreenshotsTable_1 = require("../models/ScreenshotsTable");
const CommandRecorder_1 = require("./CommandRecorder");
const DomStateListener_1 = require("./DomStateListener");
const FrameEnvironment_1 = require("./FrameEnvironment");
const InjectedScripts_1 = require("./InjectedScripts");
const { log } = (0, Logger_1.default)(module);
class Tab extends eventUtils_1.TypedEventEmitter {
    get id() {
        return this.page.tabId;
    }
    get navigations() {
        return this.mainFrameEnvironment.navigations;
    }
    get navigationsObserver() {
        return this.mainFrameEnvironment.frame.navigationsObserver;
    }
    get url() {
        return this.navigations.currentUrl;
    }
    get lastCommandId() {
        return this.session.commands.lastId;
    }
    // need to implement ISessionMeta for serialization
    get tabId() {
        return this.id;
    }
    get sessionId() {
        return this.session.id;
    }
    get mainFrameId() {
        return this.mainFrameEnvironment.id;
    }
    get mainFrameEnvironment() {
        return this.frameEnvironmentsByDevtoolsId.get(this.page.mainFrame.id);
    }
    constructor(session, page, parentTabId) {
        super();
        this.frameEnvironmentsById = new Map();
        this.frameEnvironmentsByDevtoolsId = new Map();
        this.isClosing = false;
        this.detachedElementsPendingHTML = new Set();
        this.events = new EventSubscriber_1.default();
        this.waitTimeouts = [];
        this.domStateListenersByJsPathId = {};
        this.session = session;
        this.page = page;
        this.parentTabId = parentTabId;
        this.createdAtCommandId = session.commands.lastId;
        this.logger = log.createChild(module, {
            tabId: this.id,
            sessionId: session.id,
        });
        this.setEventsToLog(this.logger, ['child-tab-created', 'close', 'dialog', 'websocket-message']);
        for (const frame of page.frames) {
            const frameEnvironment = new FrameEnvironment_1.default(this, frame);
            this.frameEnvironmentsByDevtoolsId.set(frameEnvironment.devtoolsFrameId, frameEnvironment);
            this.frameEnvironmentsById.set(frameEnvironment.id, frameEnvironment);
        }
        this.mirrorNetwork = new MirrorNetwork_1.default({
            ignoreJavascriptRequests: true,
            headersFilter: ['set-cookie'],
            loadResourceDetails: MirrorNetwork_1.default.loadResourceFromDb.bind(MirrorNetwork_1.default, this.session.db),
        });
        this.mirrorPage = this.createMirrorPage();
        this.listen();
        this.isReady = this.waitForReady();
        this.commandRecorder = new CommandRecorder_1.default(this, this.session, this.id, this.mainFrameId, [
            this.focus,
            this.dismissDialog,
            this.findResource,
            this.findResources,
            this.getFrameEnvironments,
            this.goto,
            this.goBack,
            this.goForward,
            this.reload,
            this.assert,
            this.takeScreenshot,
            this.detachResource,
            this.registerFlowHandler,
            this.registerFlowCommand,
            this.waitForFileChooser,
            this.waitForMillis,
            this.waitForNewTab,
            this.waitForResources,
            this.runPluginCommand,
            this.addRemoteEventListener,
            this.removeRemoteEventListener,
            // DO NOT ADD waitForReady
        ]);
    }
    createMirrorPage(cleanupOnTabClose = true) {
        const mirrorPage = new MirrorPage_1.default(this.mirrorNetwork, {
            paintEvents: [],
            mainFrameIds: new Set([this.mainFrameId]),
            documents: [],
            domNodePathByFrameId: this.session.db.frames.frameDomNodePathsById,
        });
        mirrorPage.subscribe(this, cleanupOnTabClose);
        return mirrorPage;
    }
    getFrameEnvironment(frameId) {
        return frameId ? this.frameEnvironmentsById.get(frameId) : this.mainFrameEnvironment;
    }
    isAllowedCommand(method) {
        return (this.commandRecorder.fnNames.has(method) ||
            method === 'close' ||
            method === 'getResourceProperty');
    }
    async setBlockedResourceTypes(blockedResourceTypes) {
        const mitmSession = this.session.mitmRequestSession;
        let interceptor = mitmSession.interceptorHandlers.find(x => x.types && !x.handlerFn);
        if (!interceptor) {
            mitmSession.interceptorHandlers.push({ types: [] });
            interceptor = mitmSession.interceptorHandlers[mitmSession.interceptorHandlers.length - 1];
        }
        let enableJs = true;
        if (blockedResourceTypes.includes('None')) {
            interceptor.types.length = 0;
        }
        else if (blockedResourceTypes.includes('All')) {
            interceptor.types.push('Image', 'Stylesheet', 'Script', 'Font', 'Ico', 'Media');
            enableJs = false;
        }
        else if (blockedResourceTypes.includes('BlockAssets')) {
            interceptor.types.push('Image', 'Stylesheet', 'Script');
        }
        else {
            if (blockedResourceTypes.includes('BlockImages')) {
                interceptor.types.push('Image');
            }
            if (blockedResourceTypes.includes('BlockCssResources')) {
                interceptor.types.push('Stylesheet');
            }
            if (blockedResourceTypes.includes('BlockFonts')) {
                interceptor.types.push('Font');
            }
            if (blockedResourceTypes.includes('BlockIcons')) {
                interceptor.types.push('Ico');
            }
            if (blockedResourceTypes.includes('BlockMedia')) {
                interceptor.types.push('Media');
            }
            if (blockedResourceTypes.includes('BlockJsResources')) {
                interceptor.types.push('Script');
            }
            if (blockedResourceTypes.includes('JsRuntime')) {
                enableJs = false;
            }
        }
        await this.page.setJavaScriptEnabled(enableJs);
    }
    setBlockedResourceUrls(blockedUrls) {
        const mitmSession = this.session.mitmRequestSession;
        let interceptor = mitmSession.interceptorHandlers.find(x => x.types && !x.handlerFn);
        if (!interceptor) {
            mitmSession.interceptorHandlers.push({ types: [] });
            interceptor = mitmSession.interceptorHandlers[mitmSession.interceptorHandlers.length - 1];
        }
        interceptor.urls = blockedUrls;
    }
    setInterceptedResources(interceptedResources) {
        const mitmSession = this.session.mitmRequestSession;
        if (interceptedResources) {
            for (const resource of interceptedResources) {
                if (resource) {
                    const interceptor = {
                        types: [],
                        urls: [resource.url],
                        handlerFn: async (url, type, request, response) => {
                            if (resource.statusCode) {
                                response.statusCode = resource.statusCode;
                            }
                            if (resource.headers) {
                                for (const [key, value] of Object.entries(resource.headers)) {
                                    response.setHeader(key, value);
                                }
                            }
                            if (resource.body) {
                                response.end(resource.body);
                            }
                            else {
                                response.end();
                            }
                            return true;
                        },
                    };
                    mitmSession.interceptorHandlers.push(interceptor);
                }
            }
        }
    }
    async close() {
        if (this.isClosing)
            return;
        this.isClosing = true;
        const parentLogId = this.logger.stats('Tab.Closing');
        const errors = [];
        await this.pendingCollects();
        try {
            this.mirrorNetwork?.close();
            await this.mirrorPage?.close();
        }
        catch (error) {
            if (!error.message.includes('Target closed') && !(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                errors.push(error);
            }
        }
        try {
            await this.page.domStorageTracker.finalFlush(5e3);
        }
        catch (error) {
            if (!error.message.includes('Target closed') && !(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                errors.push(error);
            }
        }
        try {
            const cancelMessage = 'Terminated command because session closing';
            Timer_1.default.expireAll(this.waitTimeouts, new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage));
            for (const frame of this.frameEnvironmentsById.values()) {
                frame.close();
            }
            this.cancelPendingEvents(cancelMessage);
        }
        catch (error) {
            if (!error.message.includes('Target closed') && !(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                errors.push(error);
            }
        }
        try {
            this.page.off('close', this.close);
            // run this one individually
            await this.page.close();
        }
        catch (error) {
            if (!error.message.includes('Target closed') && !(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                errors.push(error);
            }
        }
        this.events.close();
        this.commandRecorder.cleanup();
        this.commandRecorder = null;
        this.emit('close');
        // clean up listener memory
        this.removeAllListeners();
        this.session = null;
        this.frameEnvironmentsById.clear();
        this.frameEnvironmentsByDevtoolsId.clear();
        this.logger.stats('Tab.Closed', { parentLogId, errors });
    }
    async setOrigin(origin) {
        const mitmSession = this.session.mitmRequestSession;
        const originalBlocker = [...mitmSession.interceptorHandlers];
        mitmSession.interceptorHandlers.unshift({
            urls: [origin],
            handlerFn(url, type, request, response) {
                response.end(`<html lang="en"><head><link rel="icon" href="data:,"></head><body>Empty</body></html>`);
                return true;
            },
        });
        try {
            await this.page.navigate(origin);
        }
        finally {
            // restore originals
            mitmSession.interceptorHandlers = originalBlocker;
        }
    }
    async detachResource(name, resourceId, timestamp) {
        const resource = this.session.resources.get(resourceId);
        if (!resource)
            throw new Error('Unknown resource collected');
        this.session.db.detachedResources.insert(this.id, resourceId, name, timestamp, this.session.commands.lastId);
        const detachedResource = {
            name,
            commandId: this.session.commands.lastId,
            timestamp,
            resource: resource,
            websocketMessages: [],
        };
        resource.response.buffer = await this.session.db.resources.getResourceBodyById(resourceId, true);
        if (resource.type === 'Websocket') {
            detachedResource.websocketMessages = this.session.websocketMessages.getMessages(resourceId);
        }
        this.session.emit('collected-asset', { type: 'resource', asset: detachedResource });
        return detachedResource;
    }
    async getResourceProperty(resourceId, propertyPath) {
        if (propertyPath === 'response.buffer') {
            return await this.session.db.resources.getResourceBodyById(resourceId, true);
        }
        if (propertyPath === 'request.postData') {
            return this.session.db.resources.getResourcePostDataById(resourceId);
        }
        if (propertyPath === 'messages') {
            return this.session.websocketMessages.getMessages(resourceId);
        }
    }
    findResource(filter, options) {
        // escape query string ? so it can run as regex
        if (typeof filter.url === 'string') {
            filter.url = stringToRegex(filter.url);
        }
        const sinceCommandId = options?.sinceCommandId ?? this.navigations.lastHttpNavigationRequest?.startCommandId;
        // find latest resource
        for (const resourceMeta of this.session.resources.getForTab(this.id).reverse()) {
            if (this.isResourceFilterMatch(resourceMeta, filter, sinceCommandId)) {
                return Promise.resolve(resourceMeta);
            }
        }
        return Promise.resolve(null);
    }
    findResources(filter, options) {
        // escape query string ? so it can run as regex
        if (typeof filter.url === 'string') {
            filter.url = stringToRegex(filter.url);
        }
        const sinceCommandId = options?.sinceCommandId ?? this.navigations.lastHttpNavigationRequest?.startCommandId;
        // find all resources
        const resourceMetas = this.session.resources.getForTab(this.id).filter(meta => {
            return this.isResourceFilterMatch(meta, filter, sinceCommandId);
        });
        return Promise.resolve(resourceMetas);
    }
    findStorageChange(filter) {
        return this.session.db.storageChanges.findChange(this.id, filter);
    }
    /////// DELEGATED FNS ////////////////////////////////////////////////////////////////////////////////////////////////
    interact(...interactionGroups) {
        return this.mainFrameEnvironment.interact(...interactionGroups);
    }
    isPaintingStable() {
        return this.mainFrameEnvironment.isPaintingStable();
    }
    isDomContentLoaded() {
        return this.mainFrameEnvironment.isDomContentLoaded();
    }
    isAllContentLoaded() {
        return this.mainFrameEnvironment.isAllContentLoaded();
    }
    getJsValue(path) {
        return this.mainFrameEnvironment.getJsValue(path);
    }
    execJsPath(jsPath) {
        return this.mainFrameEnvironment.execJsPath(jsPath);
    }
    getUrl() {
        return this.mainFrameEnvironment.getUrl();
    }
    waitForLoad(status, options) {
        return this.mainFrameEnvironment.waitForLoad(status, options);
    }
    async waitForLocation(trigger, options) {
        return await this.mainFrameEnvironment.waitForLocation(trigger, options);
    }
    /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////
    getFrameEnvironments() {
        return Promise.resolve([...this.frameEnvironmentsById.values()].filter(x => x.isAttached).map(x => x.toJSON()));
    }
    async goto(url, options) {
        return await this.page.goto(url, options);
    }
    async goBack(options) {
        return await this.page.goBack(options);
    }
    async goForward(options) {
        return await this.page.goForward(options);
    }
    async reload(options) {
        return await this.page.reload(options);
    }
    async focus() {
        await this.page.bringToFront();
    }
    pendingCollects() {
        return Promise.all(this.detachedElementsPendingHTML);
    }
    onResource(x) {
        if (!x)
            return;
        x.response ??= {};
        const resourceSummary = {
            id: x.id,
            frameId: x.frameId,
            tabId: x.tabId,
            url: x.url,
            method: x.request.method,
            type: x.type,
            statusCode: x.response.statusCode,
            redirectedToUrl: x.isRedirect ? x.response.url : null,
            timestamp: x.response.timestamp,
            hasResponse: x.response.headers && Object.keys(x.response.headers).length > 0,
            contentType: x.response.headers
                ? (x.response.headers['content-type'] ?? x.response.headers['Content-Type'])
                : '',
        };
        this.mirrorNetwork.addResource(resourceSummary);
    }
    onElementRequested(detachedElement, saveToDb = true) {
        const resolvable = new Resolvable_1.default();
        const resolveExisting = Promise.all(this.detachedElementsPendingHTML);
        this.detachedElementsPendingHTML.add(resolvable);
        if (saveToDb) {
            this.session.db.detachedElements.insert(detachedElement);
        }
        // Don't await this so promise explosions don't escape
        // eslint-disable-next-line promise/catch-or-return
        resolveExisting
            .then(() => this.getElementHtml(detachedElement))
            .then(resolvable.resolve)
            .catch(error => {
            this.logger.warn('DetachedElement.collectHTML:Error', {
                error,
                id: detachedElement.id,
            });
            resolvable.resolve(null);
        })
            .finally(() => this.detachedElementsPendingHTML.delete(resolvable));
        return resolvable.promise;
    }
    async getElementHtml(detachedElement) {
        await this.flushDomChanges();
        const paintIndex = this.mirrorPage.getPaintIndex(detachedElement.domChangesTimestamp);
        try {
            await this.mirrorPage.openInContext(await this.session.core.getUtilityContext(), this.sessionId, this.session.viewport);
            const frameDomNodeId = this.frameEnvironmentsById.get(detachedElement.frameId).domNodeId;
            const outerHtml = await this.mirrorPage.getNodeOuterHtml(paintIndex, detachedElement.nodePointerId, frameDomNodeId);
            detachedElement.documentUrl = outerHtml.url;
            detachedElement.outerHTML = outerHtml.html;
            this.session.db.detachedElements.updateHtml(detachedElement);
            this.session.emit('collected-asset', { type: 'element', asset: detachedElement });
        }
        catch (error) {
            this.logger.warn('Tab.getElementHtml: ERROR', {
                Element: detachedElement,
                error,
            });
        }
        return detachedElement;
    }
    takeScreenshot(options = {}) {
        if (options.rectangle)
            options.rectangle.scale ??= 1;
        return this.page.screenshot(options);
    }
    async dismissDialog(accept, promptText) {
        return await this.page.dismissDialog(accept, promptText);
    }
    async waitForNewTab(options = {}) {
        // last command is the one running right now
        const startCommandId = Number.isInteger(options.sinceCommandId)
            ? options.sinceCommandId
            : this.lastCommandId - 1;
        let newTab;
        const startTime = new Date();
        let timeoutMs = options?.timeoutMs ?? 30e3;
        if (startCommandId >= 0) {
            for (const tab of this.session.tabsById.values()) {
                if (tab.parentTabId === this.id && tab.createdAtCommandId >= startCommandId) {
                    newTab = tab;
                    break;
                }
            }
        }
        if (!newTab)
            newTab = await this.waitOn('child-tab-created', undefined, timeoutMs);
        // wait for a real url to be requested
        if (newTab.url === 'about:blank' || !newTab.url) {
            const millis = Date.now() - startTime.getTime();
            timeoutMs -= millis;
            await newTab.navigations.waitOn('navigation-requested', null, timeoutMs).catch(() => null);
        }
        const timeoutMsElapsed = Date.now() - startTime.getTime();
        timeoutMs -= timeoutMsElapsed;
        await newTab.mainFrameEnvironment.waitForLoad(Location_1.LoadStatus.JavascriptReady, {
            timeoutMs,
        });
        return newTab;
    }
    async waitForResources(filter, options) {
        const timer = new Timer_1.default(options?.timeoutMs ?? 60e3, this.waitTimeouts);
        const resourcesById = {};
        const promise = (0, utils_1.createPromise)();
        let sinceCommandId = -1;
        if (options?.sinceCommandId !== undefined && Number.isInteger(options.sinceCommandId)) {
            sinceCommandId = options.sinceCommandId;
        }
        else {
            const history = this.session.commands.history;
            sinceCommandId = history[history.length - 2]?.id;
        }
        // escape query string ? if url filter is a string
        // ie http://test.com?param=1 will treat the question mark as an optional char
        if (typeof filter.url === 'string') {
            filter.url = stringToRegex(filter.url);
        }
        const onResource = (resourceMeta) => {
            if (resourcesById[resourceMeta.id] ||
                !this.isResourceFilterMatch(resourceMeta, filter, sinceCommandId))
                return;
            resourcesById[resourceMeta.id] = resourceMeta;
            // resolve if any match
            promise.resolve();
        };
        try {
            this.on('resource', onResource);
            for (const resource of this.session.resources.getForTab(this.id)) {
                onResource(resource);
            }
            await timer.waitForPromise(promise.promise, 'Timeout waiting for resources');
        }
        catch (err) {
            const shouldIgnoreError = err instanceof TimeoutError_1.default && options?.throwIfTimeout === false;
            if (!shouldIgnoreError)
                throw err;
        }
        finally {
            this.off('resource', onResource);
            timer.clear();
        }
        return Object.values(resourcesById);
    }
    async waitForFileChooser(options) {
        let startCommandId = options?.sinceCommandId && Number.isInteger(options.sinceCommandId)
            ? options.sinceCommandId
            : null;
        if (!startCommandId && this.session.commands.length >= 2) {
            startCommandId = this.session.commands.history[this.session.commands.length - 2]?.id;
        }
        let event;
        if (this.lastFileChooserEvent) {
            const { atCommandId } = this.lastFileChooserEvent;
            if (atCommandId >= startCommandId) {
                event = this.lastFileChooserEvent.event;
            }
        }
        if (!event) {
            event = await this.page.waitOn('filechooser', null, options?.timeoutMs ?? 30e3);
        }
        return event.prompt;
    }
    waitForMillis(millis) {
        return new Timer_1.default(millis, this.waitTimeouts).waitForTimeout();
    }
    async runPluginCommand(toPluginId, args) {
        const commandMeta = {
            page: this.page,
            frame: this.mainFrameEnvironment?.frame,
        };
        return await this.session.plugins.onPluginCommand(toPluginId, commandMeta, args);
    }
    willRunCommand(command) {
        const lastCommand = this.session.commands.last;
        const prevFrameId = lastCommand?.frameId ?? this.mainFrameId;
        if (lastCommand && prevFrameId !== command.frameId) {
            // if changing frames, need to clear out interactions
            this.frameEnvironmentsById.get(prevFrameId)?.setInteractionDisplay(false, true, true);
        }
    }
    addDomStateListener(id, options) {
        const listener = new DomStateListener_1.default(id, options, this);
        this.domStateListenersByJsPathId[id] = listener;
        this.events.once(listener, 'resolved', () => delete this.domStateListenersByJsPathId[id]);
        this.emit('wait-for-domstate', { listener });
        return listener;
    }
    async flushDomChanges() {
        for (const frame of this.frameEnvironmentsById.values()) {
            await frame.flushPageEventsRecorder();
        }
        this.session.db.flush();
    }
    async getDomChanges(frameId, sinceCommandId) {
        await this.mainFrameEnvironment.flushPageEventsRecorder();
        this.session.db.flush();
        return this.session.db.domChanges.getFrameChanges(frameId ?? this.mainFrameId, sinceCommandId);
    }
    registerFlowHandler(name, id, callsitePath) {
        this.session.db.flowHandlers.insert({
            name,
            id,
            tabId: this.id,
            callsite: JSON.stringify(callsitePath),
        });
        return Promise.resolve();
    }
    registerFlowCommand(id, parentId, callsitePath) {
        this.session.db.flowCommands.insert({
            id,
            parentId,
            tabId: this.id,
            callsite: JSON.stringify(callsitePath),
        });
        return Promise.resolve();
    }
    /////// CLIENT EVENTS ////////////////////////////////////////////////////////////////////////////////////////////////
    async assert(batchId, domStateIdJsPath) {
        const domStateListener = this.domStateListenersByJsPathId[JSON.stringify(domStateIdJsPath)];
        return await domStateListener.runBatchAssert(batchId);
    }
    addRemoteEventListener(type, emitFn, jsPath, options) {
        const listener = this.session.commands.observeRemoteEvents(type, emitFn, jsPath, this.id);
        if (type === 'message') {
            const [domain, resourceId] = jsPath;
            if (domain !== 'resources') {
                throw new Error(`Unknown "message" type requested in JsPath - ${domain}`);
            }
            // need to give client time to register function sending events
            process.nextTick(() => this.session.websocketMessages.listen(Number(resourceId), listener.listenFn));
        }
        else if (type === 'dom-state') {
            const id = JSON.stringify(jsPath);
            const domStateListener = this.addDomStateListener(id, options);
            this.events.on(domStateListener, 'updated', listener.listenFn);
        }
        else {
            this.on(type, listener.listenFn);
        }
        return Promise.resolve({ listenerId: listener.id });
    }
    removeRemoteEventListener(listenerId, options) {
        const listener = this.session.commands.getRemoteEventListener(listenerId);
        const { listenFn, type, jsPath } = listener;
        if (jsPath) {
            if (type === 'message') {
                const [domain, resourceId] = jsPath;
                if (domain !== 'resources') {
                    throw new Error(`Unknown "message" type requested in JsPath - ${domain}`);
                }
                this.session.websocketMessages.unlisten(Number(resourceId), listenFn);
            }
            if (type === 'dom-state') {
                const id = JSON.stringify(jsPath);
                this.domStateListenersByJsPathId[id]?.stop(options);
            }
        }
        else {
            this.off(type, listenFn);
        }
        return Promise.resolve();
    }
    /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////
    toJSON() {
        return {
            tabId: this.id,
            frameId: this.mainFrameId,
            parentTabId: this.parentTabId,
            sessionId: this.sessionId,
            url: this.url,
            createdAtCommandId: this.createdAtCommandId,
        }; // must adhere to session meta spec
    }
    async waitForReady() {
        await this.mainFrameEnvironment.isReady;
        if (this.session.options?.blockedResourceTypes) {
            await this.setBlockedResourceTypes(this.session.options.blockedResourceTypes);
        }
        if (this.session.options?.blockedResourceUrls) {
            await this.setBlockedResourceUrls(this.session.options.blockedResourceUrls);
        }
        if (this.session.options?.interceptedResources) {
            await this.setInterceptedResources(this.session.options.interceptedResources);
        }
    }
    listen() {
        const page = this.page;
        this.events.on(this, 'resource', this.onResource.bind(this));
        this.close = this.close.bind(this);
        this.events.once(page, 'close', this.close);
        this.events.on(page, 'page-error', this.onPageError.bind(this), true);
        this.events.on(page, 'crashed', this.onTargetCrashed.bind(this));
        this.events.on(page, 'console', this.onConsole.bind(this), true);
        this.events.on(page, 'frame-created', this.onFrameCreated.bind(this), true);
        this.events.on(page, 'page-callback-triggered', this.onPageCallback.bind(this));
        this.events.on(page, 'dialog-opening', this.onDialogOpening.bind(this));
        this.events.on(page, 'filechooser', this.onFileChooser.bind(this));
        this.events.on(page, 'screenshot', this.onScreenshot.bind(this));
        this.events.on(page.browserContext.resources, 'browser-will-request', this.onResourceWillBeRequested.bind(this));
        this.events.on(page, 'dom-storage-updated', this.onStorageUpdated.bind(this), true);
    }
    onPageCallback(event) {
        if (event.name === InjectedScripts_1.default.PageEventsCallbackName) {
            const { frameId, payload } = event;
            if (!frameId || !this.frameEnvironmentsById.has(frameId)) {
                log.warn('DomRecorder.bindingCalledBeforeExecutionTracked', {
                    sessionId: this.sessionId,
                    payload,
                });
                return;
            }
            this.frameEnvironmentsById.get(frameId).onPageRecorderEvents(JSON.parse(payload));
        }
    }
    /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////
    isResourceFilterMatch(resourceMeta, filter, sinceCommandId) {
        if (resourceMeta.tabId !== this.id)
            return false;
        if (!resourceMeta.seenAtCommandId) {
            resourceMeta.seenAtCommandId = this.lastCommandId;
            this.session.db.resources.updateSeenAtCommandId(resourceMeta.id, resourceMeta.seenAtCommandId);
        }
        else if (sinceCommandId && resourceMeta.seenAtCommandId <= sinceCommandId) {
            return false;
        }
        if (filter.type && resourceMeta.type !== filter.type)
            return false;
        if (filter.url && !resourceMeta.url.match(filter.url))
            return false;
        if (!filter.httpRequest)
            return true;
        const { method, statusCode } = filter.httpRequest;
        if (method && resourceMeta.request.method !== method)
            return false;
        if (statusCode && resourceMeta.response?.statusCode !== statusCode) {
            return false;
        }
        return true;
    }
    onResourceWillBeRequested(event) {
        if (!this.mirrorNetwork)
            return;
        const { resource, mitmMatch } = event;
        this.mirrorNetwork.addRequestedResource({
            id: mitmMatch.mitmResourceId,
            frameId: mitmMatch.frameId,
            tabId: mitmMatch.tabId,
            url: mitmMatch.url,
            method: mitmMatch.method,
            type: mitmMatch.resourceType,
            statusCode: resource.status,
            redirectedToUrl: resource.redirectedToUrl,
            timestamp: mitmMatch.requestTime,
            hasResponse: false,
            contentType: '',
        });
    }
    onScreenshot(event) {
        if (!this.session.db.screenshots.includeWhiteScreens &&
            ScreenshotsTable_1.default.isBlankImage(event.imageBase64)) {
            return;
        }
        this.session.db.screenshots.insert({
            tabId: this.id,
            image: Buffer.from(event.imageBase64, 'base64'),
            timestamp: event.timestamp,
        });
    }
    onStorageUpdated(event) {
        this.session.db.storageChanges.insert(this.id, null, event);
    }
    onFrameCreated(event) {
        if (this.frameEnvironmentsByDevtoolsId.has(event.frame.id))
            return;
        const pageFrame = this.page.framesManager.framesById.get(event.frame.id);
        const frame = new FrameEnvironment_1.default(this, pageFrame);
        this.frameEnvironmentsByDevtoolsId.set(frame.devtoolsFrameId, frame);
        this.frameEnvironmentsById.set(frame.id, frame);
    }
    /////// LOGGING EVENTS ///////////////////////////////////////////////////////////////////////////
    onPageError(event) {
        const { error, frameId } = event;
        this.logger.info('Window.pageError', { error, frameId });
        this.session.db.pageLogs.insert(this.id, frameId, `events.page-error`, error.stack || String(error), new Date());
    }
    onConsole(event) {
        const { frameId, type, message, location } = event;
        let level = 'info';
        if (message.startsWith('ERROR:') && message.includes(DomOverridesBuilder_1.injectedSourceUrl)) {
            level = 'error';
        }
        this.logger[level]('Window.console', { message });
        this.session.db.pageLogs.insert(this.id, frameId, type, message, new Date(), location);
    }
    onTargetCrashed(event) {
        const error = event.error;
        const errorLevel = event.fatal ? 'error' : 'info';
        this.logger[errorLevel]('BrowserEngine.Tab.crashed', { error });
        this.session.db.pageLogs.insert(this.id, this.mainFrameId, `events.error`, error.stack || String(error), new Date());
    }
    translateDevtoolsFrameId(devtoolsFrameId) {
        return this.frameEnvironmentsByDevtoolsId.get(devtoolsFrameId)?.id ?? this.mainFrameId;
    }
    /////// DIALOGS //////////////////////////////////////////////////////////////////////////////////
    onDialogOpening(event) {
        this.emit('dialog', event.dialog);
    }
    onFileChooser(event) {
        this.lastFileChooserEvent = { event, atCommandId: this.lastCommandId };
    }
    // CREATE
    static create(session, page, parentTabId, openParams) {
        const tab = new Tab(session, page, parentTabId);
        tab.logger.info('Tab.created', {
            parentTabId,
            openParams,
        });
        return tab;
    }
}
exports.default = Tab;
function stringToRegex(str) {
    if (str.startsWith('*'))
        str = `.*${str.slice(1)}`;
    const escaped = str.replace(/\/\*/g, '/.*').replace(/[-[/\]{}()+?.,\\^$|#\s]/g, '\\$&');
    return new RegExp(escaped);
}
//# sourceMappingURL=Tab.js.map