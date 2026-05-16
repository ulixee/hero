"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Timer_1 = require("@ulixee/commons/lib/Timer");
const utils_1 = require("@ulixee/commons/lib/utils");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const Url = require("url");
const DomStorageTracker_1 = require("./DomStorageTracker");
const FramesManager_1 = require("./FramesManager");
const Keyboard_1 = require("./Keyboard");
const Mouse_1 = require("./Mouse");
const NetworkManager_1 = require("./NetworkManager");
const Worker_1 = require("./Worker");
class Page extends eventUtils_1.TypedEventEmitter {
    get id() {
        return this.targetId;
    }
    get mainFrame() {
        return this.framesManager?.main;
    }
    get frames() {
        return this.framesManager?.activeFrames;
    }
    get workers() {
        return [...this.workersById.values()];
    }
    get lastActivityId() {
        return this.browserContext.commandMarker.lastId;
    }
    constructor(devtoolsSession, targetId, browserContext, logger, opener, pageOptions) {
        super();
        this.workersById = new Map();
        this.runPageScripts = true;
        this.isClosed = false;
        this.installJsPathIntoIsolatedContext = true;
        this.isClosing = false;
        this.closePromise = (0, utils_1.createPromise)();
        this.events = new EventSubscriber_1.default();
        this.waitTimeouts = [];
        browserContext.idTracker.tabId += 1;
        this.tabId = browserContext.idTracker.tabId;
        this.opener = opener;
        this.targetId = targetId;
        this.browserContext = browserContext;
        this.devtoolsSession = devtoolsSession;
        this.installJsPathIntoIsolatedContext = pageOptions?.installJsPathIntoDefaultContext !== true;
        this.runPageScripts = pageOptions?.runPageScripts !== false;
        this.groupName = pageOptions?.groupName;
        this.logger = logger.createChild(module, {
            targetId,
        });
        this.logger.info('Page.created');
        this.keyboard = new Keyboard_1.Keyboard(devtoolsSession);
        this.mouse = new Mouse_1.default(devtoolsSession, this.keyboard);
        this.networkManager = new NetworkManager_1.default(devtoolsSession, this.logger, this.browserContext.proxy, this.browserContext.secretKey);
        this.domStorageTracker = new DomStorageTracker_1.default(this, browserContext.domStorage, this.networkManager, this.logger, pageOptions?.enableDomStorageTracker ?? true);
        this.framesManager = new FramesManager_1.default(this, devtoolsSession);
        this.storeEventsWithoutListeners = true;
        this.setEventsToLog(this.logger, [
            'frame-created',
            'websocket-frame',
            'websocket-handshake',
            'navigation-response',
            'worker',
        ]);
        this.framesManager.addEventEmitter(this, ['frame-created', 'frame-navigated']);
        this.domStorageTracker.addEventEmitter(this, ['dom-storage-updated']);
        this.networkManager.addEventEmitter(this, [
            'navigation-response',
            'websocket-frame',
            'websocket-handshake',
            'resource-will-be-requested',
            'resource-was-requested',
            'resource-loaded',
            'resource-failed',
        ]);
        const session = this.devtoolsSession;
        this.events.once(session, 'disconnected', this.emit.bind(this, 'close'));
        this.bindSessionEvents(session);
        const resources = this.browserContext.resources;
        // websocket events
        this.events.on(this.networkManager, 'websocket-handshake', resources.onWebsocketHandshake.bind(resources, this.tabId));
        this.events.on(this.networkManager, 'websocket-frame', this.onWebsocketFrame.bind(this));
        browserContext.trackPage(this);
        this.isReady = this.initialize().catch(error => {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError && this.isClosing)
                return;
            this.logger.error('Page.initializationError', {
                error,
            });
            throw error;
        });
    }
    async setNetworkRequestInterceptor(networkRequestsFn) {
        return await this.networkManager.setNetworkInterceptor(networkRequestsFn, true);
    }
    interact(...interactionGroups) {
        return this.mainFrame.interact(...interactionGroups);
    }
    click(jsPathOrSelector, verification) {
        return this.mainFrame.click(jsPathOrSelector, verification);
    }
    type(text) {
        return this.mainFrame.interact([{ command: 'type', keyboardCommands: [{ string: text }] }]);
    }
    addNewDocumentScript(script, isolatedEnvironment, callbacks, devtoolsSession) {
        return this.framesManager.addNewDocumentScript(script, isolatedEnvironment, callbacks, devtoolsSession);
    }
    removeDocumentScript(identifier, devtoolsSession) {
        return (devtoolsSession ?? this.devtoolsSession).send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
    }
    async setJavaScriptEnabled(enabled) {
        await this.devtoolsSession.send('Emulation.setScriptExecutionDisabled', {
            value: !enabled,
        });
    }
    evaluate(expression, options) {
        return this.mainFrame.evaluate(expression, options);
    }
    async navigate(url, options = {}) {
        const navigationResponse = await this.devtoolsSession.send('Page.navigate', {
            url,
            referrer: options.referrer,
            frameId: this.mainFrame.id,
        });
        if (navigationResponse.errorText)
            throw new Error(navigationResponse.errorText);
        await this.framesManager.waitForFrame(navigationResponse, url, true);
        return { loaderId: navigationResponse.loaderId };
    }
    async goto(url, options) {
        let formattedUrl;
        let navigateOptions = {};
        try {
            formattedUrl = Url.format(new Url.URL(url), { unicode: true });
        }
        catch (error) {
            throw new Error('Cannot navigate to an invalid URL');
        }
        this.browserContext.commandMarker.incrementMark?.('goto');
        const navigation = this.mainFrame.navigations.onNavigationRequested('goto', formattedUrl, this.lastActivityId, null);
        if (options?.timeoutMs) {
            this.browserContext.resources.setNavigationConnectTimeoutMs(formattedUrl, options.timeoutMs);
        }
        if (options?.referrer) {
            navigateOptions = {
                referrer: options?.referrer,
            };
        }
        const timeoutMessage = `Timeout waiting for "tab.goto(${url})"`;
        const timer = new Timer_1.default(options?.timeoutMs ?? 30e3, this.waitTimeouts);
        const loader = await timer.waitForPromise(this.navigate(formattedUrl, navigateOptions), timeoutMessage);
        this.mainFrame.navigations.assignLoaderId(navigation, loader.loaderId);
        const resourceId = await timer.waitForPromise(this.mainFrame.navigationsObserver.waitForNavigationResourceId(), timeoutMessage);
        return this.browserContext.resources.get(resourceId);
    }
    waitForLoad(status, options) {
        return this.mainFrame.waitForLoad({ ...(options ?? {}), loadStatus: status });
    }
    execJsPath(jsPath) {
        return this.mainFrame.jsPath.exec(jsPath);
    }
    async goBack(options) {
        this.mainFrame.navigations.initiatedUserAction = {
            reason: 'goBack',
            startCommandId: this.lastActivityId,
        };
        this.browserContext.commandMarker.incrementMark?.('goBack');
        await this.navigateToHistory(-1);
        if (this.mainFrame.isDefaultUrl)
            return this.mainFrame.url;
        await this.mainFrame.waitForLoad({
            loadStatus: options?.waitForLoadStatus ?? Location_1.LoadStatus.PaintingStable,
            timeoutMs: options?.timeoutMs,
        });
        return this.mainFrame.url;
    }
    async goForward(options) {
        this.mainFrame.navigations.initiatedUserAction = {
            reason: 'goForward',
            startCommandId: this.lastActivityId,
        };
        this.browserContext.commandMarker.incrementMark?.('goForward');
        await this.navigateToHistory(1);
        if (this.mainFrame.isDefaultUrl)
            return this.mainFrame.url;
        await this.mainFrame.waitForLoad({
            loadStatus: options?.waitForLoadStatus ?? Location_1.LoadStatus.PaintingStable,
            timeoutMs: options?.timeoutMs,
        });
        return this.mainFrame.url;
    }
    async reload(options) {
        this.mainFrame.navigations.initiatedUserAction = {
            reason: 'reload',
            startCommandId: this.lastActivityId,
        };
        this.browserContext.commandMarker.incrementMark?.('reload');
        const timer = new Timer_1.default(options?.timeoutMs ?? 30e3, this.waitTimeouts);
        const timeoutMessage = `Timeout waiting for "tab.reload()"`;
        const loaderId = this.mainFrame.activeLoader.id;
        await timer.waitForPromise(this.devtoolsSession.send('Page.reload'), timeoutMessage);
        if (this.mainFrame.activeLoader.id === loaderId) {
            await timer.waitForPromise(this.mainFrame.waitOn('frame-navigated', null, options?.timeoutMs), timeoutMessage);
        }
        const resource = await timer.waitForPromise(this.mainFrame.navigationsObserver.waitForNavigationResourceId(), timeoutMessage);
        return this.browserContext.resources.get(resource);
    }
    async bringToFront() {
        await this.devtoolsSession.send('Page.bringToFront');
    }
    async dismissDialog(accept, promptText) {
        const resolvable = (0, utils_1.createPromise)();
        this.mainFrame.interactor.play([[{ command: IInteractions_1.InteractionCommand.willDismissDialog }]], resolvable);
        await resolvable.promise;
        await this.devtoolsSession.send('Page.handleJavaScriptDialog', {
            accept,
            promptText,
        });
    }
    async screenshot(options) {
        options ??= {};
        const quality = options.jpegQuality ?? 100;
        const clipRect = options.rectangle;
        const format = options.format ?? 'jpeg';
        (0, utils_1.assert)(quality >= 0 && quality <= 100, `Expected options.quality to be between 0 and 100 (inclusive), got ${quality}`);
        let clip = clipRect;
        if (clip) {
            clip.x = Math.round(clip.x);
            clip.y = Math.round(clip.y);
            clip.height = Math.round(clip.height);
            clip.width = Math.round(clip.width);
        }
        const captureBeyondViewport = !!(clip || options.fullPage);
        if (options.fullPage) {
            const layoutMetrics = await this.devtoolsSession.send('Page.getLayoutMetrics');
            const { scale } = layoutMetrics.visualViewport;
            const contentSize = layoutMetrics.cssContentSize ?? layoutMetrics.contentSize;
            clip = { x: 0, y: 0, ...contentSize, scale };
        }
        const result = await this.devtoolsSession.send('Page.captureScreenshot', {
            format,
            quality,
            clip,
            captureBeyondViewport, // added in chrome 87 works since 89
        });
        const timestamp = Date.now();
        this.emit('screenshot', {
            imageBase64: result.data,
            timestamp,
        });
        return Buffer.from(result.data, 'base64');
    }
    onWorkerAttached(devtoolsSession, targetInfo) {
        const targetId = targetInfo.targetId;
        this.browserContext.beforeWorkerAttached(devtoolsSession, targetId, this.targetId);
        const worker = new Worker_1.Worker(this.browserContext, this.networkManager, devtoolsSession, this.logger, targetInfo);
        if (worker.type !== 'shared_worker')
            this.workersById.set(targetId, worker);
        this.browserContext.onWorkerAttached(worker);
        this.events.on(worker, 'console', this.emit.bind(this, 'console'));
        this.events.on(worker, 'page-error', this.emit.bind(this, 'page-error'));
        this.events.on(worker, 'close', () => this.workersById.delete(targetId));
        this.emit('worker', { worker });
        return worker.isReady;
    }
    async reset() {
        if (this.isClosing || this.closePromise.isResolved)
            return this.closePromise.promise;
        if (this.devtoolsSession.isConnected())
            return;
        this.mainFrame.navigations.reset();
        this.networkManager.reset();
        this.framesManager.reset();
        this.workersById.clear();
        this.domStorageTracker.reset();
        try {
            await this.navigate('about:blank');
            await this.mainFrame.waitForLifecycleEvent('load');
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            throw error;
        }
    }
    async close(options) {
        if (this.isClosing || this.closePromise.isResolved)
            return this.closePromise.promise;
        this.isClosing = true;
        const parentLogId = this.logger.stats('Page.Closing');
        options ??= {};
        const timeoutMs = options.timeoutMs ?? 30e3;
        try {
            const cancelMessage = 'Terminated command because Page closing';
            Timer_1.default.expireAll(this.waitTimeouts, new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage));
            if (this.devtoolsSession.isConnected() && !this.isClosed) {
                const timeout = setTimeout(() => this.didClose(), timeoutMs);
                // trigger beforeUnload
                try {
                    await this.devtoolsSession.send('Page.close');
                }
                catch (err) {
                    if (!err.message.includes('Not attached to an active page') &&
                        !err.message.includes('Target closed') &&
                        !(err instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                        throw err;
                    }
                    this.didClose();
                }
                clearTimeout(timeout);
            }
            else {
                this.didClose();
            }
            await this.closePromise.promise;
        }
        finally {
            this.logger.stats('Page.Closed', { parentLogId });
        }
    }
    onTargetKilled(errorCode) {
        this.emit('crashed', {
            error: new Error(`Page crashed - killed by Chrome with code ${errorCode}`),
            fatal: true,
        });
        this.didClose();
    }
    didClose(closeError) {
        if (this.closePromise.isResolved)
            return;
        this.isClosing = true;
        this.isClosed = true;
        try {
            this.framesManager.close(closeError);
            this.networkManager.close();
            this.domStorageTracker.close();
            this.events.close();
            const cancelMessage = 'Terminated command because Page closing';
            Timer_1.default.expireAll(this.waitTimeouts, closeError ?? new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage));
            this.cancelPendingEvents(cancelMessage, ['close']);
            for (const worker of this.workersById.values()) {
                worker.close();
            }
            // clear memory
            this.cleanup();
        }
        catch (error) {
            this.logger.error('Page.didClose().error', {
                error,
            });
        }
        finally {
            this.closePromise.resolve();
            this.emit('close');
            this.removeAllListeners();
        }
    }
    bindSessionEvents(session) {
        const id = session.id;
        this.events.once(session, 'disconnected', () => this.events.endGroup(id));
        this.events.group(id, this.events.on(session, 'Inspector.targetCrashed', this.onTargetCrashed.bind(this)), this.events.on(session, 'Target.attachedToTarget', this.onAttachedToTarget.bind(this)), this.events.on(session, 'Page.javascriptDialogOpening', this.onJavascriptDialogOpening.bind(this)), this.events.on(session, 'Page.javascriptDialogClosed', this.onJavascriptDialogClosed.bind(this)), this.events.on(session, 'Page.fileChooserOpened', this.onFileChooserOpened.bind(this)), this.events.on(session, 'Page.windowOpen', this.onWindowOpen.bind(this)), this.events.on(session, 'Page.screencastFrame', this.onScreencastFrame.bind(this)));
    }
    cleanup() {
        this.waitTimeouts.length = 0;
        this.workersById.clear();
        this.framesManager = null;
        this.networkManager = null;
        this.domStorageTracker = null;
        this.popupInitializeFn = null;
        this.browserContext = null;
    }
    async navigateToHistory(delta) {
        const history = await this.devtoolsSession.send('Page.getNavigationHistory');
        const entry = history.entries[history.currentIndex + delta];
        if (!entry)
            return null;
        await Promise.all([
            this.devtoolsSession.send('Page.navigateToHistoryEntry', { entryId: entry.id }),
            this.mainFrame.waitOn('frame-navigated'),
        ]);
        return entry.url;
    }
    async initialize() {
        const promises = [
            this.networkManager.initialize().catch(err => err),
            this.framesManager.initialize(this.devtoolsSession).catch(err => err),
            this.domStorageTracker.initialize().catch(err => err),
            this.devtoolsSession
                .send('Target.setAutoAttach', {
                autoAttach: true,
                waitForDebuggerOnStart: true,
                flatten: true,
            })
                .catch(err => err),
            this.browserContext.initializePage(this).catch(err => err),
            this.devtoolsSession
                .send('Page.setInterceptFileChooserDialog', { enabled: true })
                .catch(err => err),
            this.devtoolsSession.send('Runtime.runIfWaitingForDebugger').catch(err => err),
        ];
        for (const error of await Promise.all(promises)) {
            if (error && error instanceof Error)
                throw error;
        }
        this.events.on(this.mainFrame, 'frame-navigated', this.onMainFrameNavigated.bind(this));
        if (this.opener && this.opener.popupInitializeFn) {
            this.logger.stats('Popup triggered', {
                targetId: this.targetId,
                opener: this.opener.targetId,
            });
            await this.opener.isReady;
            if (this.opener.isClosed) {
                this.logger.stats('Popup canceled', {
                    targetId: this.targetId,
                });
                return;
            }
            if (this.mainFrame.isDefaultUrl) {
                // if we're on the default page, wait for a loader to be created before telling the page it's ready
                await this.mainFrame.waitOn('frame-loader-created', null, 2e3).catch(() => null);
                if (this.isClosed)
                    return;
            }
            await this.opener.popupInitializeFn(this, this.opener.windowOpenParams);
            this.logger.stats('Popup initialized', {
                targetId: this.targetId,
                windowOpenParams: this.opener.windowOpenParams,
            });
        }
    }
    onAttachedToTarget(event) {
        const { sessionId, targetInfo, waitingForDebugger } = event;
        const devtoolsSession = this.devtoolsSession.connection.getSession(sessionId);
        if (targetInfo.type === 'iframe') {
            this.browserContext.onIframeAttached(devtoolsSession, targetInfo, this.targetId);
            return this.framesManager.onFrameTargetAttached(devtoolsSession, targetInfo);
        }
        if (targetInfo.type === 'service_worker' ||
            targetInfo.type === 'shared_worker' ||
            targetInfo.type === 'worker') {
            return this.onWorkerAttached(devtoolsSession, targetInfo);
        }
        if (waitingForDebugger) {
            return devtoolsSession
                .send('Runtime.runIfWaitingForDebugger')
                .catch(error => {
                this.logger.error('Runtime.runIfWaitingForDebugger.Error', {
                    error,
                    devtoolsSessionId: sessionId,
                });
            })
                .then(() => 
            // detach from page session
            this.devtoolsSession.send('Target.detachFromTarget', { sessionId }))
                .catch(() => null);
        }
    }
    onTargetCrashed() {
        this.emit('crashed', { error: new Error('Target Crashed') });
    }
    onWindowOpen(event) {
        this.windowOpenParams = event;
    }
    onJavascriptDialogOpening(dialog) {
        this.activeDialog = dialog;
        this.emit('dialog-opening', { dialog });
    }
    onJavascriptDialogClosed(event) {
        this.activeDialog = null;
        this.emit('dialog-closed', { wasConfirmed: event.result, userInput: event.userInput });
    }
    onMainFrameNavigated(event) {
        if (event.navigatedInDocument)
            return;
        void this.devtoolsSession
            .send('Page.setInterceptFileChooserDialog', { enabled: true })
            .catch(() => null);
    }
    onFileChooserOpened(event) {
        const frame = this.framesManager.framesById.get(event.frameId);
        frame
            .trackBackendNodeAsNodePointer(event.backendNodeId)
            .then(nodePointerId => this.emit('filechooser', {
            prompt: {
                jsPath: [nodePointerId],
                frameId: frame.frameId,
                selectMultiple: event.mode === 'selectMultiple',
            },
        }))
            .catch(() => null);
    }
    onScreencastFrame(event) {
        this.devtoolsSession
            .send('Page.screencastFrameAck', { sessionId: event.sessionId })
            .catch(() => null);
        this.emit('screenshot', {
            imageBase64: event.data,
            timestamp: event.metadata.timestamp * 1000,
        });
    }
    onWebsocketFrame(event) {
        const resourceId = this.browserContext.resources.getBrowserRequestLatestResource(event.browserRequestId)?.id;
        const isMitmEnabled = this.browserContext.resources.hasRegisteredMitm;
        this.browserContext.websocketMessages.record({
            resourceId,
            message: event.message,
            isFromServer: event.isFromServer,
            lastCommandId: this.lastActivityId,
            timestamp: event.timestamp,
        }, isMitmEnabled);
    }
}
exports.default = Page;
//# sourceMappingURL=Page.js.map