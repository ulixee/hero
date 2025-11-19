"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Frame_framesManager;
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Timer_1 = require("@ulixee/commons/lib/Timer");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const url_1 = require("url");
const ProtocolError_1 = require("../errors/ProtocolError");
const ConsoleMessage_1 = require("./ConsoleMessage");
const FrameNavigations_1 = require("./FrameNavigations");
const FrameNavigationsObserver_1 = require("./FrameNavigationsObserver");
const FrameOutOfProcess_1 = require("./FrameOutOfProcess");
const FramesManager_1 = require("./FramesManager");
const Interactor_1 = require("./Interactor");
const JsPath_1 = require("./JsPath");
const MouseListener_1 = require("./MouseListener");
const NavigationLoader_1 = require("./NavigationLoader");
const ContextNotFoundCode = -32000;
const InPageNavigationLoaderPrefix = 'inpage';
class Frame extends eventUtils_1.TypedEventEmitter {
    get id() {
        return this.internalFrame.id;
    }
    get name() {
        return this.internalFrame.name ?? '';
    }
    get parentId() {
        return this.internalFrame.parentId;
    }
    get isDefaultUrl() {
        return !this.url || this.url === ':' || this.url === FramesManager_1.DEFAULT_PAGE;
    }
    get securityOrigin() {
        if (!this.activeLoader?.isNavigationComplete || this.isDefaultUrl)
            return '';
        let origin = this.internalFrame.securityOrigin;
        if (!origin || origin === '://') {
            if (this.url.startsWith('about:'))
                return '';
            this.internalFrame.securityOrigin = new url_1.URL(this.url).origin;
            origin = this.internalFrame.securityOrigin ?? '';
        }
        return origin;
    }
    get isAttached() {
        return this.checkIfAttached();
    }
    get activeLoader() {
        return this.navigationLoadersById[this.activeLoaderId];
    }
    get childFrames() {
        const list = [];
        for (const value of __classPrivateFieldGet(this, _Frame_framesManager, "f").activeFrames) {
            if (value.parentId === this.id)
                list.push(value);
        }
        return list;
    }
    get page() {
        return __classPrivateFieldGet(this, _Frame_framesManager, "f")?.page;
    }
    get hooks() {
        return this.page.browserContext.hooks;
    }
    get defaultContextId() {
        this._defaultContextId ??= this.page.framesManager
            .getDefaultContextIdForFrameId({ frameId: this.id, devtoolsSession: this.devtoolsSession })
            .catch(error => {
            this._defaultContextId = undefined;
            throw error;
        });
        return this._defaultContextId;
    }
    get isolatedContextId() {
        this._isolatedContextId ??= this.createIsolatedWorld().catch(error => {
            this._isolatedContextId = undefined;
            throw error;
        });
        return this._isolatedContextId;
    }
    constructor(framesManager, internalFrame, devtoolsSession, logger, checkIfAttached, parentFrame) {
        super();
        this.didSwapOutOfProcess = false;
        this.navigationLoadersById = {};
        this.pendingNewDocumentScripts = [];
        _Frame_framesManager.set(this, void 0);
        this.waitTimeouts = [];
        this.isClosing = false;
        this.inPageCounter = 0;
        this.events = new EventSubscriber_1.default();
        this.devtoolsNodeIdByNodePointerId = {};
        const idTracker = framesManager.page.browserContext.idTracker;
        idTracker.frameId += 1;
        this.frameId = idTracker.frameId;
        __classPrivateFieldSet(this, _Frame_framesManager, framesManager, "f");
        this.devtoolsSession = devtoolsSession;
        this.logger = logger.createChild(module, { frameId: this.frameId });
        this.navigations = new FrameNavigations_1.default(this, this.logger);
        this.navigationsObserver = new FrameNavigationsObserver_1.default(this.navigations);
        this.jsPath = new JsPath_1.JsPath(this, this.logger);
        this.parentFrame = parentFrame;
        this.interactor = new Interactor_1.default(this);
        this.checkIfAttached = checkIfAttached;
        this.setEventsToLog(this.logger, ['frame-navigated']);
        this.storeEventsWithoutListeners = true;
        this.onAttached(internalFrame);
    }
    async updateDevtoolsSession(devtoolsSession) {
        if (this.devtoolsSession === devtoolsSession)
            return;
        this.devtoolsSession = devtoolsSession;
        if (devtoolsSession === __classPrivateFieldGet(this, _Frame_framesManager, "f").devtoolsSession ||
            devtoolsSession === this.parentFrame?.devtoolsSession) {
            this.outOfProcess = null;
            return;
        }
        this.outOfProcess = new FrameOutOfProcess_1.default(this.page, this);
        if (!this.url) {
            this.defaultLoaderId = this.activeLoaderId;
        }
        await this.outOfProcess.initialize();
    }
    isOopif() {
        return !!this.outOfProcess;
    }
    close(error) {
        this.isClosing = true;
        const cancelMessage = 'Cancel Pending Promise. Frame closed.';
        this.cancelPendingEvents(cancelMessage);
        error ??= new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage);
        Timer_1.default.expireAll(this.waitTimeouts, error);
        this.navigationsObserver.cancelWaiting(cancelMessage);
        this.activeLoader.setNavigationResult(error);
        this.defaultContextCreated?.reject(error);
        this.closedWithError = error;
        this.events.close();
    }
    async runPendingNewDocumentScripts() {
        if (this.closedWithError)
            throw this.closedWithError;
        if (this.activeLoaderId !== this.defaultLoaderId)
            return;
        if (this.parentId)
            return;
        const newDocumentScripts = [
            ...__classPrivateFieldGet(this, _Frame_framesManager, "f").pendingNewDocumentScripts,
            ...this.pendingNewDocumentScripts,
        ];
        if (newDocumentScripts.length) {
            const scripts = [...newDocumentScripts];
            __classPrivateFieldGet(this, _Frame_framesManager, "f").pendingNewDocumentScripts.length = 0;
            if (this.closedWithError || !this.devtoolsSession.isConnected())
                return;
            await Promise.all(scripts.map(async (script) => {
                if (this.closedWithError || !this.devtoolsSession.isConnected())
                    return;
                const contextId = await this.waitForContextId(script.isolated);
                return this.devtoolsSession
                    .send('Runtime.evaluate', {
                    expression: script.script,
                    contextId,
                })
                    .catch(err => {
                    if (this.closedWithError || err instanceof IPendingWaitEvent_1.CanceledPromiseError)
                        return;
                    this.logger.warn('NewDocumentScriptError', { err });
                });
            }));
        }
    }
    async evaluate(expression, options) {
        const cancelMessage = 'Cancel Pending Promise. Frame closed.';
        if (this.isClosing) {
            throw new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage);
        }
        ;
        // can't run javascript if active dialog!
        if (this.page.activeDialog) {
            throw new Error('Cannot run frame.evaluate while an active dialog is present!!');
        }
        if (this.closedWithError)
            throw this.closedWithError;
        if (!this.parentId) {
            await this.runPendingNewDocumentScripts();
        }
        const isolateFromWebPageEnvironment = options?.isolateFromWebPageEnvironment ?? false;
        let contextId;
        try {
            // We only need to find context id when running in isolated mode, or in a frame other than the main frame.
            if (isolateFromWebPageEnvironment || this !== this.page?.mainFrame) {
                contextId = await this.waitForContextId(isolateFromWebPageEnvironment);
                if (!contextId) {
                    const notFound = new Error('Could not find a valid context for this request');
                    notFound.code = ContextNotFoundCode;
                    throw notFound;
                }
            }
            const result = await this.devtoolsSession.send('Runtime.evaluate', {
                expression,
                contextId,
                returnByValue: options?.returnByValue ?? true,
                includeCommandLineAPI: options?.includeCommandLineAPI ?? false,
                awaitPromise: options?.shouldAwaitExpression ?? true,
            }, this, { timeoutMs: options?.timeoutMs });
            if (result.exceptionDetails) {
                throw ConsoleMessage_1.default.exceptionToError(result.exceptionDetails);
            }
            const remote = result.result;
            if (remote.objectId)
                this.devtoolsSession.disposeRemoteObject(remote);
            return remote.value;
        }
        catch (err) {
            if (this.isClosing) {
                throw new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage);
                ;
            }
            ;
            const isNotFoundError = err.code === ContextNotFoundCode ||
                err.remoteError?.code === ContextNotFoundCode;
            if (isNotFoundError) {
                this.resetContextIds();
                const activeContextId = await this.waitForContextId(isolateFromWebPageEnvironment);
                let retries = options?.retriesWaitingForLoad ?? 0;
                if (activeContextId !== contextId) {
                    retries += 1;
                }
                if (retries > 0) {
                    // Cannot find context with specified id (ie, could be reloading or unloading)
                    return this.evaluate(expression, {
                        ...(options ?? {}),
                        retriesWaitingForLoad: retries - 1,
                    });
                }
                throw new IPendingWaitEvent_1.CanceledPromiseError('The page context to evaluate javascript was not found');
            }
            throw err;
        }
    }
    async waitForLoad(options) {
        if (this.isOopif() && !this.url) {
            await new Promise(resolve => this.events.once(this, 'frame-navigated', resolve));
        }
        return await this.navigationsObserver.waitForLoad(options?.loadStatus ?? Location_1.LoadStatus.JavascriptReady, options);
    }
    async waitForLocation(trigger, options) {
        const timer = new Timer_1.default(options?.timeoutMs ?? 60e3, this.waitTimeouts);
        const navigation = await timer.waitForPromise(this.navigationsObserver.waitForLocation(trigger, options), `Timeout waiting for location ${trigger}`);
        await new Promise(setImmediate);
        await timer.waitForPromise(this.navigationsObserver.waitForNavigationResourceId(navigation), `Timeout waiting for location ${trigger}`);
        return navigation;
    }
    click(jsPathOrSelector, verification) {
        let jsPath = jsPathOrSelector;
        if (typeof jsPath === 'string')
            jsPath = ['document', ['querySelector', jsPathOrSelector]];
        return this.interact([{ command: 'click', mousePosition: jsPath, verification }]);
    }
    async interact(...interactionGroups) {
        const timeoutMs = 120e3;
        const interactionResolvable = new Resolvable_1.default(timeoutMs);
        await this.navigationsObserver.waitForLoad(Location_1.LoadStatus.JavascriptReady, {
            timeoutMs,
            doNotIncrementMarker: true,
        });
        this.waitTimeouts.push({
            timeout: interactionResolvable.timeout,
            reject: interactionResolvable.reject,
        });
        const cancelForNavigation = new IPendingWaitEvent_1.CanceledPromiseError('Frame navigated');
        const cancelOnNavigate = () => {
            interactionResolvable.reject(cancelForNavigation);
        };
        let frameCancelEvent;
        try {
            this.interactor.play(interactionGroups, interactionResolvable);
            frameCancelEvent = this.events.once(this, 'frame-navigated', cancelOnNavigate);
            await interactionResolvable.promise;
        }
        catch (error) {
            if (error === cancelForNavigation)
                return;
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError && this.isClosing)
                return;
            throw error;
        }
        finally {
            this.events.off(frameCancelEvent);
        }
    }
    async waitForScrollStop(timeoutMs) {
        return await MouseListener_1.default.waitForScrollStop(this, timeoutMs);
    }
    async getWindowOffset() {
        return await MouseListener_1.default.getWindowOffset(this);
    }
    async getNodePointerId(devtoolsObjectId) {
        return await this.evaluateOnNode(devtoolsObjectId, 'NodeTracker.watchNode(this)');
    }
    async getFrameElementNodePointerId() {
        const frameElementNodeId = await this.getFrameElementDevtoolsNodeId();
        if (!frameElementNodeId)
            return null;
        return this.parentFrame.getNodePointerId(frameElementNodeId);
    }
    // get absolute x/y coordinates of frame container element relative to page
    async getContainerOffset() {
        if (!this.parentId)
            return { x: 0, y: 0 };
        const parentOffset = await this.parentFrame.getContainerOffset();
        const frameElementNodeId = await this.getFrameElementDevtoolsNodeId();
        const thisOffset = await this.parentFrame.evaluateOnNode(frameElementNodeId, `(() => {
      const rect = this.getBoundingClientRect();
      return { x:rect.x, y:rect.y };
 })()`);
        return {
            x: thisOffset.x + parentOffset.x,
            y: thisOffset.y + parentOffset.y,
        };
    }
    outerHTML() {
        return this.evaluate(`(() => {
  let retVal = '';
  if (document.doctype)
    retVal = new XMLSerializer().serializeToString(document.doctype);
  if (document.documentElement)
    retVal += document.documentElement.outerHTML;
  return retVal;
})()`, {
            shouldAwaitExpression: false,
            retriesWaitingForLoad: 1,
            isolateFromWebPageEnvironment: this.page.installJsPathIntoIsolatedContext,
        });
    }
    async waitForLifecycleEvent(event = 'load', loaderId, timeoutMs = 30e3) {
        event ??= 'load';
        timeoutMs ??= 30e3;
        await this.waitForNavigationLoader(loaderId, timeoutMs);
        const loader = this.navigationLoadersById[loaderId ?? this.activeLoaderId];
        if (loader.lifecycle[event])
            return;
        await this.waitOn('frame-lifecycle', x => {
            if (loaderId && x.loader.id !== loaderId)
                return false;
            return x.name === event;
        }, timeoutMs);
    }
    async setFileInputFiles(nodePointerId, files) {
        const objectId = this.devtoolsNodeIdByNodePointerId[nodePointerId];
        await this.devtoolsSession.send('DOM.setFileInputFiles', {
            objectId,
            files,
        }, this);
    }
    async evaluateOnNode(devtoolsObjectId, expression) {
        if (this.closedWithError)
            throw this.closedWithError;
        try {
            const result = await this.devtoolsSession.send('Runtime.callFunctionOn', {
                functionDeclaration: `function executeRemoteFn() {
        return ${expression};
      }`,
                returnByValue: true,
                objectId: devtoolsObjectId,
            }, this);
            if (result.exceptionDetails) {
                throw ConsoleMessage_1.default.exceptionToError(result.exceptionDetails);
            }
            const remote = result.result;
            if (remote.objectId)
                this.devtoolsSession.disposeRemoteObject(remote);
            return remote.value;
        }
        catch (err) {
            if (err instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            throw err;
        }
    }
    async getFrameElementDevtoolsNodeId() {
        try {
            if (!this.parentFrame || this.frameElementDevtoolsNodeId)
                return this.frameElementDevtoolsNodeId;
            this.frameElementDevtoolsNodeId = this.parentFrame.devtoolsSession
                .send('DOM.getFrameOwner', { frameId: this.id }, this)
                .then(owner => this.parentFrame.resolveDevtoolsNodeId(owner.backendNodeId, true));
            // don't dispose... will cleanup frame
            return await this.frameElementDevtoolsNodeId;
        }
        catch (error) {
            // ignore errors looking this up
            this.logger.info('Failed to lookup isolated node', {
                frameId: this.id,
                error,
            });
        }
    }
    async resolveDevtoolsNodeId(backendNodeId, resolveInIsolatedContext = true) {
        const result = await this.devtoolsSession.send('DOM.resolveNode', {
            backendNodeId,
            executionContextId: await this.waitForContextId(resolveInIsolatedContext),
        }, this);
        return result.object.objectId;
    }
    async trackBackendNodeAsNodePointer(backendNodeId) {
        const devtoolsNodeId = await this.resolveDevtoolsNodeId(backendNodeId);
        const nodePointerId = await this.getNodePointerId(devtoolsNodeId);
        this.devtoolsNodeIdByNodePointerId[nodePointerId] = devtoolsNodeId;
        return nodePointerId;
    }
    /////// NAVIGATION ///////////////////////////////////////////////////////////////////////////////////////////////////
    initiateNavigation(url, loaderId) {
        this.waitTimeouts.length = 0;
        this.defaultContextCreated = null;
        // chain current listeners to new promise
        this.setLoader(loaderId, url);
    }
    requestedNavigation(url, reason, disposition) {
        this.navigationReason = reason;
        this.disposition = disposition;
        // disposition options: currentTab, newTab, newWindow, download
        this.navigations.updateNavigationReason(url, reason);
        this.emit('frame-requested-navigation', { frame: this, url, reason });
    }
    onAttached(internalFrame) {
        this.internalFrame = internalFrame;
        this.updateUrl();
        if (!internalFrame.loaderId)
            return;
        // if we this is the first loader and url is default, this is the first loader
        if (this.isDefaultUrl &&
            !this.defaultLoaderId &&
            Object.keys(this.navigationLoadersById).length === 0) {
            this.defaultLoaderId = internalFrame.loaderId;
        }
        this.setLoader(internalFrame.loaderId);
        if (this.url || internalFrame.unreachableUrl) {
            // if this is a loaded frame, just count it as loaded. it shouldn't fail
            this.navigationLoadersById[internalFrame.loaderId].setNavigationResult(internalFrame.url);
        }
    }
    onNavigated(frame, navigatedEvent) {
        this.internalFrame = frame;
        this.updateUrl();
        const loader = this.navigationLoadersById[frame.loaderId] ?? this.activeLoader;
        if (frame.unreachableUrl) {
            loader.setNavigationResult(new Error(`Unreachable url for navigation "${frame.unreachableUrl}"`));
        }
        else {
            loader.setNavigationResult(frame.url);
        }
        if (this.isDefaultUrl && this.parentId && !this.navigations.top) {
            const top = this.navigations.onNavigationRequested('newFrame', this.url, 0, loader.id);
            this.navigations.setPageReady(top, Date.now());
        }
        if (navigatedEvent.type === 'BackForwardCacheRestore') {
            this.navigations.onNavigationRequested('goForwardOrBack', this.url, this.page.browserContext.commandMarker.lastId, loader.id);
        }
        this.emit('frame-navigated', { frame: this, loaderId: frame.loaderId });
    }
    onNavigatedWithinDocument(url) {
        if (this.url === url)
            return;
        // we're using params on about:blank, so make sure to strip for url
        if (url.startsWith(FramesManager_1.DEFAULT_PAGE))
            url = FramesManager_1.DEFAULT_PAGE;
        let isForActiveDomain = false;
        if (this.activeLoader) {
            try {
                const previousUrl = new url_1.URL(this.activeLoader.url);
                if (url.startsWith(previousUrl.origin)) {
                    isForActiveDomain = true;
                }
            }
            catch { }
        }
        this.url = url;
        const isDomLoaded = isForActiveDomain && this.activeLoader?.lifecycle?.DOMContentLoaded;
        const loaderId = `${InPageNavigationLoaderPrefix}${(this.inPageCounter += 1)}`;
        this.setLoader(loaderId, url);
        if (isDomLoaded) {
            this.activeLoader.markLoaded();
        }
        if (isForActiveDomain) {
            // set load state back to all loaded
            this.navigations.onNavigationRequested('inPage', this.url, this.page.browserContext.commandMarker.lastId, loaderId);
            this.emit('frame-navigated', { frame: this, navigatedInDocument: true, loaderId });
        }
    }
    /////// LIFECYCLE ////////////////////////////////////////////////////////////////////////////////////////////////////
    onStoppedLoading() {
        if (!this.startedLoaderId)
            return;
        const loader = this.navigationLoadersById[this.startedLoaderId];
        loader?.onStoppedLoading();
    }
    async waitForDefaultLoader() {
        const hasLoaderError = await this.navigationLoadersById[this.defaultLoaderId]?.navigationResolver;
        if (hasLoaderError instanceof Error)
            throw hasLoaderError;
        await this.page.isReady;
    }
    async waitForNavigationLoader(loaderId, timeoutMs) {
        if (!loaderId) {
            loaderId = this.activeLoaderId;
            if (loaderId === this.defaultLoaderId) {
                // wait for an actual frame to load
                const frameLoader = await this.waitOn('frame-loader-created', null, timeoutMs ?? 60e3);
                loaderId = frameLoader.loaderId;
            }
        }
        const hasLoaderError = await this.navigationLoadersById[loaderId]?.navigationResolver;
        if (hasLoaderError instanceof Error)
            throw hasLoaderError;
    }
    onLifecycleEvent(name, timestamp, pageLoaderId) {
        const loaderId = pageLoaderId ?? this.activeLoaderId;
        if (name === 'init' && pageLoaderId) {
            this.defaultLoaderId ??= pageLoaderId;
            if (loaderId && this.defaultLoaderId && loaderId !== this.defaultLoaderId) {
                const defaultLoader = this.navigationLoadersById[this.defaultLoaderId];
                if (!defaultLoader.isNavigationComplete) {
                    defaultLoader.navigationResolver.resolve(FramesManager_1.DEFAULT_PAGE);
                }
            }
            // if the active loader never initiates before this new one, we should notify
            if (this.activeLoaderId &&
                this.activeLoaderId !== pageLoaderId &&
                !this.activeLoader.lifecycle.init &&
                !this.activeLoader.isNavigationComplete) {
                // match chrome error if navigation is intercepted
                this.activeLoader.setNavigationResult(new IPendingWaitEvent_1.CanceledPromiseError('net::ERR_ABORTED'));
            }
            this.startedLoaderId = pageLoaderId;
        }
        if (!this.navigationLoadersById[loaderId]) {
            this.setLoader(loaderId);
        }
        this.navigationLoadersById[loaderId].onLifecycleEvent(name);
        if (loaderId !== this.activeLoaderId) {
            let checkLoaderForInPage = false;
            for (const [historicalLoaderId, loader] of Object.entries(this.navigationLoadersById)) {
                if (loaderId === historicalLoaderId) {
                    checkLoaderForInPage = true;
                }
                if (checkLoaderForInPage && historicalLoaderId.startsWith(InPageNavigationLoaderPrefix)) {
                    loader.onLifecycleEvent(name);
                    this.triggerLifecycleEvent(name, loader, timestamp);
                }
            }
        }
        if (loaderId !== this.defaultLoaderId) {
            this.triggerLifecycleEvent(name, this.navigationLoadersById[loaderId], timestamp);
        }
    }
    toJSON() {
        return {
            id: this.id,
            parentId: this.parentId,
            name: this.name,
            url: this.url,
            navigationReason: this.navigationReason,
            disposition: this.disposition,
            activeLoader: this.activeLoader,
        };
    }
    async waitForContextId(isolatedFromWebPageEnvironment) {
        if (isolatedFromWebPageEnvironment) {
            return await this.isolatedContextId;
        }
        return await this.defaultContextId;
    }
    resetContextIds() {
        this._defaultContextId = undefined;
        this._isolatedContextId = undefined;
    }
    setLoader(loaderId, url) {
        if (!loaderId)
            return;
        if (loaderId === this.activeLoaderId)
            return;
        if (this.navigationLoadersById[loaderId])
            return;
        this.activeLoaderId = loaderId;
        this.logger.info('Queuing new navigation loader', {
            loaderId,
            frameId: this.id,
        });
        this.navigationLoadersById[loaderId] = new NavigationLoader_1.NavigationLoader(loaderId, this.logger);
        if (url)
            this.navigationLoadersById[loaderId].url = url;
        this.emit('frame-loader-created', {
            frame: this,
            loaderId,
        });
    }
    async createIsolatedWorld() {
        try {
            if (!this.isAttached)
                return;
            // If an isolated world with the same worldName already exists chromium will reuse that world,
            // so calling this multiple times is safe, and can be used as creative way to get id of existing context.
            // We need this because our isolated world is created with `Page.addScriptToEvaluateOnNewDocument`
            // of which we don't know the contextId (since we are running with Runtime disabled to prevent detection).
            const isolatedWorld = await this.devtoolsSession.send('Page.createIsolatedWorld', {
                frameId: this.id,
                worldName: FramesManager_1.ISOLATED_WORLD,
                // param is misspelled in protocol
                grantUniveralAccess: true,
            }, this);
            const { executionContextId } = isolatedWorld;
            this.getFrameElementDevtoolsNodeId().catch(() => null);
            return executionContextId;
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError) {
                return;
            }
            if (error instanceof ProtocolError_1.default) {
                // 32000 code means frame doesn't exist, see if we just missed timing
                if (error.remoteError?.code === ContextNotFoundCode) {
                    if (!this.isAttached)
                        return;
                }
            }
            this.logger.warn('Failed to create isolated world.', {
                frameId: this.id,
                error,
            });
        }
    }
    updateUrl() {
        if (this.internalFrame.url) {
            this.url = this.internalFrame.url + (this.internalFrame.urlFragment ?? '');
            if (this.url.startsWith('data:') && !this.url.startsWith('data://')) {
                this.url = `data://${this.url.substr('data:'.length)}`;
            }
        }
        else {
            this.url = undefined;
        }
    }
    triggerLifecycleEvent(name, loader, timestamp) {
        const lowerEventName = name.toLowerCase();
        let status;
        if (lowerEventName === 'load')
            status = Location_1.LoadStatus.AllContentLoaded;
        else if (lowerEventName === 'domcontentloaded')
            status = Location_1.LoadStatus.DomContentLoaded;
        if (status) {
            this.navigations.onLoadStatusChanged(status, loader.url ?? this.url, loader.id, timestamp);
        }
        this.emit('frame-lifecycle', { frame: this, name, loader, timestamp });
    }
}
_Frame_framesManager = new WeakMap();
exports.default = Frame;
//# sourceMappingURL=Frame.js.map