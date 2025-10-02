"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISOLATED_WORLD = exports.DEFAULT_PAGE = void 0;
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const utils_1 = require("@ulixee/commons/lib/utils");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Frame_1 = require("./Frame");
const InjectedScripts_1 = require("./InjectedScripts");
const Resources_1 = require("./Resources");
const Console_1 = require("./Console");
exports.DEFAULT_PAGE = 'about:blank';
exports.ISOLATED_WORLD = '__agent_world__';
class FramesManager extends eventUtils_1.TypedEventEmitter {
    get main() {
        return this.framesById.get(this.mainFrameId);
    }
    get activeFrames() {
        return Array.from(this.attachedFrameIds).map(x => this.framesById.get(x));
    }
    get resources() {
        return this.page.browserContext.resources;
    }
    constructor(page, devtoolsSession) {
        super();
        this.framesById = new Map();
        this.framesByFrameId = new Map();
        this.pendingNewDocumentScripts = [];
        this.onFrameCreatedResourceEventsByFrameId = {};
        this.attachedFrameIds = new Set();
        this.events = new EventSubscriber_1.default();
        this.pageCallbacks = new Map();
        this.page = page;
        this.networkManager = page.networkManager;
        this.domStorageTracker = page.domStorageTracker;
        this.logger = page.logger.createChild(module);
        this.devtoolsSession = devtoolsSession;
        (0, utils_1.bindFunctions)(this);
        this.console = new Console_1.Console(devtoolsSession, this.page.browserContext.secretKey);
        this.events.on(page, 'resource-will-be-requested', this.onResourceWillBeRequested);
        this.events.on(page, 'resource-was-requested', this.onResourceWasRequested);
        this.events.on(page, 'resource-loaded', this.onResourceLoaded);
        this.events.on(page, 'resource-failed', this.onResourceFailed);
        this.events.on(page, 'navigation-response', this.onNavigationResourceResponse);
        this.events.on(this.console, 'callback-received', this.onCallbackReceived);
        this.events.on(this.networkManager, 'internal-request', (event) => {
            const url = event.request.request.url;
            if (this.console.isConsoleRegisterUrl(url)) {
                this.console.registerFrameId(url, event.request.frameId);
            }
        });
    }
    initialize(devtoolsSession) {
        this.events.group(devtoolsSession.id, this.events.on(devtoolsSession, 'Page.frameNavigated', this.onFrameNavigated.bind(this, devtoolsSession)), this.events.on(devtoolsSession, 'Page.navigatedWithinDocument', this.onFrameNavigatedWithinDocument), this.events.on(devtoolsSession, 'Page.frameRequestedNavigation', this.onFrameRequestedNavigation), this.events.on(devtoolsSession, 'Page.frameDetached', this.onFrameDetached.bind(this, devtoolsSession)), this.events.on(devtoolsSession, 'Page.frameAttached', this.onFrameAttached.bind(this, devtoolsSession)), this.events.on(devtoolsSession, 'Page.frameStoppedLoading', this.onFrameStoppedLoading), this.events.on(devtoolsSession, 'Page.lifecycleEvent', this.onLifecycleEvent.bind(this, devtoolsSession)));
        const id = devtoolsSession.id;
        this.events.once(devtoolsSession, 'disconnected', () => this.events.endGroup(id));
        this.isReady = new Promise(async (resolve, reject) => {
            try {
                const [framesResponse, , readyStateResult] = await Promise.all([
                    devtoolsSession.send('Page.getFrameTree'),
                    devtoolsSession.send('Page.enable'),
                    devtoolsSession
                        .send('Runtime.evaluate', {
                        expression: 'document.readyState',
                    })
                        .catch(() => {
                        return {
                            result: {
                                value: null,
                            },
                        };
                    }),
                    devtoolsSession.send('Page.setLifecycleEventsEnabled', { enabled: true }),
                    InjectedScripts_1.default.install(this, devtoolsSession, this.onDomPaintEvent),
                    this.console.initialize(),
                ]);
                this.recurseFrameTree(devtoolsSession, framesResponse.frameTree);
                resolve();
                if (this.main.securityOrigin && !this.main.activeLoader?.lifecycle?.load) {
                    // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
                    // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
                    await this.main.runPendingNewDocumentScripts();
                    const readyState = readyStateResult.result?.value;
                    const loaderId = this.main.activeLoaderId;
                    let loadName;
                    if (readyState === 'interactive')
                        loadName = 'DOMContentLoaded';
                    else if (readyState === 'complete')
                        loadName = 'load';
                    if (loadName)
                        setImmediate(() => this.main.onLifecycleEvent(loadName, null, loaderId));
                }
            }
            catch (error) {
                if (error instanceof IPendingWaitEvent_1.CanceledPromiseError) {
                    resolve();
                    return;
                }
                reject(error);
            }
        });
        return this.isReady;
    }
    reset() {
        for (const frame of this.framesById.values()) {
            if (frame.parentId) {
                this.framesByFrameId.delete(frame.frameId);
                this.framesById.delete(frame.id);
                frame.close();
            }
        }
        this.pendingNewDocumentScripts.length = 0;
        this.onFrameCreatedResourceEventsByFrameId = {};
    }
    close(error) {
        this.events.close();
        this.cancelPendingEvents('FramesManager closed');
        for (const frame of this.framesById.values()) {
            frame.close(error);
        }
        this.framesById.clear();
        this.framesByFrameId.clear();
    }
    async addNewDocumentScript(script, installInIsolatedScope = true, callbacks, devtoolsSession) {
        devtoolsSession ??= this.devtoolsSession;
        if (callbacks) {
            script = this.console.injectCallbackIntoScript(script);
            for (const [name, onCallbackFn] of Object.entries(callbacks)) {
                if (onCallbackFn) {
                    if (this.pageCallbacks.has(name) && this.pageCallbacks.get(name) !== onCallbackFn)
                        throw new Error(`Duplicate page callback registered ${name}`);
                    this.pageCallbacks.set(name, onCallbackFn);
                }
            }
        }
        const installedScript = await devtoolsSession.send('Page.addScriptToEvaluateOnNewDocument', {
            source: script,
            worldName: installInIsolatedScope ? exports.ISOLATED_WORLD : undefined,
        });
        this.pendingNewDocumentScripts.push({ script, isolated: installInIsolatedScope });
        // sometimes we get a new anchor link that already has an initiated frame. If that's the case, newDocumentScripts won't trigger.
        // NOTE: we DON'T want this to trigger for internal pages (':', 'about:blank')
        if (this.main?.url?.startsWith('http')) {
            await this.main.runPendingNewDocumentScripts();
        }
        return installedScript;
    }
    checkForResolvedNavigation(browserRequestId, resource, error) {
        if (resource.type !== 'Document' || resource.isRedirect)
            return;
        for (const frame of this.framesById.values()) {
            const matchingResource = frame.navigations.pendingResourceId(browserRequestId, resource.request?.url, resource.response?.url);
            if (matchingResource) {
                frame.navigations.onResourceLoaded(matchingResource, resource.id, resource.response?.statusCode, error);
                return true;
            }
        }
        return false;
    }
    frameWithPendingNavigation(browserRequestId, requestedUrl, finalUrl) {
        for (const frame of this.framesById.values()) {
            const isMatch = frame.navigations.pendingResourceId(browserRequestId, requestedUrl, finalUrl);
            if (isMatch)
                return frame;
        }
    }
    clearChildFrames() {
        for (const [id, childFrame] of this.framesById) {
            if (id !== this.mainFrameId && !this.attachedFrameIds.has(id)) {
                this.framesById.delete(id);
                this.framesByFrameId.delete(childFrame.frameId);
                try {
                    childFrame.close();
                }
                catch (error) {
                    if (!(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                        this.logger.warn('Error closing frame after navigation', {
                            error,
                            id,
                            url: childFrame.url,
                        });
                    }
                }
            }
        }
    }
    async onFrameTargetAttached(devtoolsSession, target) {
        await this.isReady;
        const frame = this.framesById.get(target.targetId);
        if (frame) {
            await frame.updateDevtoolsSession(devtoolsSession);
        }
    }
    /////// EXECUTION CONTEXT ////////////////////////////////////////////////////
    getSecurityOrigins() {
        const origins = [];
        for (const frame of this.framesById.values()) {
            if (this.attachedFrameIds.has(frame.id)) {
                const origin = frame.securityOrigin;
                if (origin && !origins.some(x => x.origin === origin)) {
                    origins.push({ origin, frameId: frame.id });
                }
            }
        }
        return origins;
    }
    async waitForFrame(frameDetails, url, isInitiatingNavigation = false) {
        await this.isReady;
        const { frameId, loaderId } = frameDetails;
        const frame = this.framesById.get(frameId);
        if (isInitiatingNavigation) {
            frame.initiateNavigation(url, loaderId);
        }
        await frame.waitForNavigationLoader(loaderId);
    }
    async getDefaultContextIdForFrameId(opts) {
        const devtoolsSession = opts.devtoolsSession ?? this.devtoolsSession;
        const contextId = new Resolvable_1.default(10e3);
        const subcriber = this.events.on(devtoolsSession, 'Runtime.executionContextCreated', event => {
            const { context } = event;
            const frameId = context.auxData.frameId;
            const type = context.auxData.type;
            if (opts.frameId === frameId &&
                context.name === '' &&
                context.auxData.isDefault === true &&
                type === 'default') {
                contextId.resolve(context.id);
            }
        });
        // Enabling and disabling will trigger ExecutionContextCreatedEvent for all contexts
        await Promise.all([
            devtoolsSession.send('Runtime.enable'),
            devtoolsSession.send('Runtime.disable'),
        ]);
        try {
            return await contextId.promise;
        }
        finally {
            this.events.off(subcriber);
        }
    }
    /////// FRAMES ///////////////////////////////////////////////////////////////
    async onFrameNavigated(devtoolsSession, navigatedEvent) {
        await this.isReady;
        const startUrl = this.main?.url;
        const frame = this.recordFrame(devtoolsSession, navigatedEvent.frame);
        // if main frame, clear out other frames
        if (!frame.parentId) {
            if (startUrl !== navigatedEvent.frame.url) {
                this.attachedFrameIds.clear();
                this.attachedFrameIds.add(frame.id);
            }
            this.clearChildFrames();
        }
        frame.onNavigated(navigatedEvent.frame, navigatedEvent);
        this.emit('frame-navigated', { frame, loaderId: navigatedEvent.frame.loaderId });
        if (!frame.isDefaultUrl && !frame.parentId && devtoolsSession === this.devtoolsSession) {
            this.pendingNewDocumentScripts.length = 0;
        }
        this.domStorageTracker.track(frame.securityOrigin);
    }
    async onFrameStoppedLoading(event) {
        await this.isReady;
        const { frameId } = event;
        this.framesById.get(frameId)?.onStoppedLoading();
    }
    async onFrameRequestedNavigation(navigatedEvent) {
        await this.isReady;
        const { frameId, url, reason, disposition } = navigatedEvent;
        this.framesById.get(frameId).requestedNavigation(url, reason, disposition);
    }
    async onFrameNavigatedWithinDocument(navigatedEvent) {
        await this.isReady;
        const { frameId, url } = navigatedEvent;
        this.framesById.get(frameId).onNavigatedWithinDocument(url);
    }
    async onFrameDetached(devtoolsSession, frameDetachedEvent) {
        await this.isReady;
        const { frameId, reason } = frameDetachedEvent;
        const parentId = this.framesById.get(frameId)?.parentId;
        if (reason === 'remove' &&
            // This is a local -> remote frame transtion, where
            // Page.frameDetached arrives after Target.attachedToTarget.
            // We've already handled the new target and frame reattach - nothing to do here.
            (devtoolsSession === this.devtoolsSession ||
                devtoolsSession === this.framesById.get(parentId)?.devtoolsSession)) {
            this.attachedFrameIds.delete(frameId);
        }
        else if (reason === 'swap') {
            this.framesById.get(frameId).didSwapOutOfProcess = true;
            this.framesById.get(frameId).activeLoader.setNavigationResult();
        }
    }
    async onFrameAttached(devtoolsSession, frameAttachedEvent) {
        await this.isReady;
        const { frameId, parentFrameId } = frameAttachedEvent;
        const frame = this.framesById.get(frameId);
        if (frame) {
            if (devtoolsSession && frame.isOopif()) {
                // If an OOP iframes becomes a normal iframe again
                // it is first attached to the parent page before
                // the target is removed.
                await frame.updateDevtoolsSession(devtoolsSession);
            }
            return;
        }
        this.recordFrame(devtoolsSession, { id: frameId, parentId: parentFrameId });
        this.attachedFrameIds.add(frameId);
    }
    async onLifecycleEvent(devtoolsSession, event) {
        await this.isReady;
        const { frameId, name, loaderId, timestamp } = event;
        const eventTime = this.networkManager.monotonicTimeToUnix(timestamp);
        const frame = this.recordFrame(devtoolsSession, { id: frameId, loaderId });
        frame.onLifecycleEvent(name, eventTime, loaderId);
        this.domStorageTracker.track(frame.securityOrigin);
    }
    onDomPaintEvent(payload, frame) {
        const { event, timestamp, url } = JSON.parse(payload);
        const frameId = frame.frameId;
        void this.isReady.then(() => {
            const coreFrame = this.framesByFrameId.get(frameId);
            coreFrame.navigations.onDomPaintEvent(event, url, timestamp);
            return null;
        });
    }
    recurseFrameTree(devtoolsSession, frameTree) {
        const { frame, childFrames } = frameTree;
        if (devtoolsSession === this.devtoolsSession) {
            this.mainFrameId = frame.id;
            this.recordFrame(devtoolsSession, frame, true);
        }
        else if (!this.framesById.has(frame.id)) {
            this.recordFrame(devtoolsSession, frame, true);
        }
        this.attachedFrameIds.add(frame.id);
        if (!childFrames)
            return;
        for (const childFrame of childFrames) {
            this.recurseFrameTree(devtoolsSession, childFrame);
        }
    }
    recordFrame(devtoolsSession, newFrame, isFrameTreeRecurse = false) {
        const { id, parentId } = newFrame;
        if (this.framesById.has(id)) {
            const frame = this.framesById.get(id);
            if (isFrameTreeRecurse || (frame.isOopif() && newFrame.url))
                frame.onAttached(newFrame);
            this.domStorageTracker.track(frame.securityOrigin);
            return frame;
        }
        const parentFrame = parentId ? this.framesById.get(parentId) : null;
        const frame = new Frame_1.default(this, newFrame, devtoolsSession, this.logger, () => this.attachedFrameIds.has(id), parentFrame);
        this.framesById.set(id, frame);
        this.framesByFrameId.set(frame.frameId, frame);
        this.emit('frame-created', { frame, loaderId: newFrame.loaderId });
        this.replayMissedResourceEventsAfterFrameAttached(frame);
        this.domStorageTracker.track(frame.securityOrigin);
        return frame;
    }
    // MERGE FROM Tab.ts. Needs to be sorted out
    replayMissedResourceEventsAfterFrameAttached(frame) {
        const resourceEvents = this.onFrameCreatedResourceEventsByFrameId[frame.id];
        if (resourceEvents) {
            for (const { event: resourceEvent, type } of resourceEvents) {
                if (type === 'resource-will-be-requested')
                    this.onResourceWillBeRequested(resourceEvent);
                if (type === 'resource-was-requested')
                    this.onResourceWasRequested(resourceEvent);
                else if (type === 'navigation-response')
                    this.onNavigationResourceResponse(resourceEvent);
                else if (type === 'resource-loaded')
                    this.onResourceLoaded(resourceEvent);
            }
        }
        delete this.onFrameCreatedResourceEventsByFrameId[frame.id];
    }
    getFrameForEventOrQueueForReady(type, event) {
        const frame = this.framesById.get(event.frameId);
        if (event.frameId && !frame) {
            this.onFrameCreatedResourceEventsByFrameId[event.frameId] ??= [];
            const events = this.onFrameCreatedResourceEventsByFrameId[event.frameId];
            if (!events.some(x => x.event === event)) {
                events.push({ event, type });
            }
        }
        return frame;
    }
    onResourceWillBeRequested(event) {
        const lastCommandId = this.page.browserContext.commandMarker.lastId;
        const { resource, isDocumentNavigation, frameId, redirectedFromUrl } = event;
        const url = resource.url.href;
        const frame = frameId
            ? this.getFrameForEventOrQueueForReady('resource-will-be-requested', event)
            : this.main;
        if (!frame)
            return;
        const navigations = frame.navigations;
        if (isDocumentNavigation && !navigations.top) {
            navigations.onNavigationRequested('newFrame', url, lastCommandId, resource.browserRequestId, event.loaderId);
        }
        resource.hasUserGesture ||= navigations.didGotoUrl(url);
        this.resources.onBrowserWillRequest(this.page.tabId, frame.frameId, resource);
        if (isDocumentNavigation && !event.resource.browserCanceled) {
            navigations.onHttpRequested(url, lastCommandId, redirectedFromUrl, resource.browserRequestId, event.loaderId);
        }
    }
    onResourceWasRequested(event) {
        const frame = event.frameId
            ? this.getFrameForEventOrQueueForReady('resource-was-requested', event)
            : this.main;
        // if we didn't get a frame, don't keep going
        if (!frame)
            return;
        this.resources.onBrowserDidRequest(this.page.tabId, frame.frameId, event.resource);
    }
    onResourceLoaded(event) {
        const { resource, frameId, loaderId } = event;
        const frame = frameId
            ? this.getFrameForEventOrQueueForReady('resource-loaded', event)
            : this.main;
        this.resources.onBrowserDidRequest(this.page.tabId, frame?.frameId, resource);
        // if we didn't get a frame, don't keep going
        if (!frame)
            return;
        const pendingResourceId = frame.navigations.pendingResourceId(resource.browserRequestId, resource.url?.href, resource.responseUrl, event.loaderId);
        if (pendingResourceId) {
            if (resource.browserServedFromCache) {
                frame.navigations.onHttpResponded(resource.browserRequestId, resource.responseUrl ?? resource.url?.href, loaderId, resource.browserLoadedTime);
            }
            const existingResource = this.resources.getBrowserRequestLatestResource(resource.browserRequestId);
            if (existingResource) {
                frame.navigations.onResourceLoaded(pendingResourceId, existingResource.id, resource.status);
            }
        }
        const isKnownResource = this.resources.onBrowserResourceLoaded(this.page.tabId, resource);
        if (!isKnownResource &&
            (resource.browserServedFromCache ||
                ['blob:', 'file:'].includes(resource.url?.protocol ?? '') ||
                !this.resources.hasRegisteredMitm)) {
            this.resources
                .createNewResourceIfUnseen(this.page.tabId, frame.frameId, resource, event.body)
                .then(meta => meta && this.checkForResolvedNavigation(resource.browserRequestId, meta))
                .catch(() => null);
        }
    }
    onResourceFailed(event) {
        const { resource } = event;
        const loadError = Resources_1.default.translateResourceError(resource);
        const frame = this.framesById.get(resource.frameId);
        const resourceMeta = this.resources.onBrowserRequestFailed(this.page.tabId, frame?.frameId, resource, loadError);
        if (resourceMeta) {
            const browserRequestId = resource.browserRequestId;
            this.checkForResolvedNavigation(browserRequestId, resourceMeta, loadError);
        }
    }
    onNavigationResourceResponse(event) {
        const frame = event.frameId
            ? this.getFrameForEventOrQueueForReady('navigation-response', event)
            : this.main;
        if (!frame) {
            return;
        }
        frame.navigations.onHttpResponded(event.browserRequestId, event.url, event.loaderId, event.timestamp);
    }
    async onCallbackReceived(event) {
        const callback = this.pageCallbacks.get(event.name);
        let frame = this.framesById.get(event.id);
        if (!frame) {
            // try again after ready
            await this.isReady;
            frame = this.framesById.get(event.id);
            if (!frame)
                return;
        }
        if (callback)
            await callback(event.payload, frame);
        this.page.emit('page-callback-triggered', {
            name: event.name,
            frameId: frame.frameId,
            payload: event.payload,
        });
    }
}
exports.default = FramesManager;
//# sourceMappingURL=FramesManager.js.map