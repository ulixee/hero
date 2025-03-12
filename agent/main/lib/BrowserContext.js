"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const url_1 = require("url");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Page_1 = require("./Page");
const Resources_1 = require("./Resources");
const WebsocketMessages_1 = require("./WebsocketMessages");
const DefaultCommandMarker_1 = require("./DefaultCommandMarker");
const DevtoolsSessionLogger_1 = require("./DevtoolsSessionLogger");
const { log } = (0, Logger_1.default)(module);
class BrowserContext extends eventUtils_1.TypedEventEmitter {
    get browserId() {
        return this.browser.id;
    }
    constructor(browser, isIncognito, options) {
        super();
        this.workersById = new Map();
        this.pagesById = new Map();
        this.pagesByTabId = new Map();
        this.targetsById = new Map();
        this.devtoolsSessionsById = new Map();
        this.hooks = {};
        this.isIncognito = true;
        this.idTracker = {
            navigationId: 0,
            tabId: 0,
            frameId: 0,
        };
        this.attachedTargetIds = new Set();
        this.pageOptionsByTargetId = new Map();
        this.createdTargetIds = new Set();
        this.creatingTargetPromises = [];
        this.waitForPageAttachedById = new Map();
        this.events = new EventSubscriber_1.default();
        this.browser = browser;
        this.proxy = options?.proxy;
        this.isIncognito = isIncognito;
        this.logger = options?.logger ?? log;
        this.hooks = options?.hooks ?? {};
        this.secretKey = options?.secretKey;
        this.commandMarker = options?.commandMarker ?? new DefaultCommandMarker_1.DefaultCommandMarker(this);
        this.resources = new Resources_1.default(this);
        this.websocketMessages = new WebsocketMessages_1.default(this.logger);
        this.devtoolsSessionLogger = new DevtoolsSessionLogger_1.default(this);
        this.devtoolsSessionLogger.subscribeToDevtoolsMessages(this.browser.devtoolsSession, {
            sessionType: 'browser',
        });
    }
    async open() {
        if (!this.isIncognito)
            return;
        const createContextOptions = {
            disposeOnDetach: true,
        };
        if (this.proxy?.address) {
            createContextOptions.proxyBypassList = '<-loopback>';
            createContextOptions.proxyServer = this.proxy.address;
        }
        // Creates a new incognito browser context. This won't share cookies/cache with other browser contexts.
        const { browserContextId } = await this.browser.devtoolsSession.send('Target.createBrowserContext', createContextOptions, this);
        this.id = browserContextId;
        this.logger = this.logger.createChild(module, {
            browserContextId,
        });
    }
    async newPage(options) {
        const createTargetPromise = new Resolvable_1.default();
        this.creatingTargetPromises.push(createTargetPromise.promise);
        const { targetId } = await this.sendWithBrowserDevtoolsSession('Target.createTarget', {
            url: 'about:blank',
            browserContextId: this.id,
            background: options ? true : undefined,
        });
        this.createdTargetIds.add(targetId);
        this.pageOptionsByTargetId.set(targetId, options);
        await this.attachToTarget(targetId);
        createTargetPromise.resolve();
        const idx = this.creatingTargetPromises.indexOf(createTargetPromise.promise);
        if (idx >= 0)
            void this.creatingTargetPromises.splice(idx, 1);
        let page = this.pagesById.get(targetId);
        if (!page) {
            const pageAttachedPromise = new Resolvable_1.default(60e3, 'Error creating page. Timed-out waiting to attach');
            this.waitForPageAttachedById.set(targetId, pageAttachedPromise);
            page = await pageAttachedPromise.promise;
            this.waitForPageAttachedById.delete(targetId);
        }
        await page.isReady;
        if (page.isClosed)
            throw new Error('Page has been closed.');
        return page;
    }
    addPageInitializationOptions(optionsByTargetId) {
        for (const [targetId, options] of Object.entries(optionsByTargetId)) {
            this.pageOptionsByTargetId.set(targetId, options);
        }
    }
    trackPage(page) {
        this.pagesById.set(page.id, page);
        this.pagesByTabId.set(page.tabId, page);
    }
    initializePage(page) {
        if (page.runPageScripts === false)
            return Promise.resolve();
        return this.hooks.onNewPage?.(page) ?? Promise.resolve();
    }
    initializeOutOfProcessIframe(frame) {
        if (frame.page.runPageScripts === false)
            return Promise.resolve();
        return this.hooks.onNewFrameProcess?.(frame.frame) ?? Promise.resolve();
    }
    onIframeAttached(devtoolsSession, targetInfo, pageId) {
        const page = this.pagesById.get(pageId);
        if (!page)
            return;
        this.devtoolsSessionLogger.subscribeToDevtoolsMessages(devtoolsSession, {
            sessionType: 'iframe',
            pageTargetId: pageId,
            iframeTargetId: targetInfo.targetId,
        });
    }
    async onPageAttached(devtoolsSession, targetInfo) {
        this.attachedTargetIds.add(targetInfo.targetId);
        this.targetsById.set(targetInfo.targetId, targetInfo);
        await Promise.all(this.creatingTargetPromises);
        if (this.pagesById.has(targetInfo.targetId))
            return;
        this.devtoolsSessionLogger.subscribeToDevtoolsMessages(devtoolsSession, {
            sessionType: 'page',
            pageTargetId: targetInfo.targetId,
        });
        const pageOptions = this.pageOptionsByTargetId.get(targetInfo.targetId);
        let opener = targetInfo.openerId ? this.pagesById.get(targetInfo.openerId) || null : null;
        if (pageOptions?.triggerPopupOnPageId) {
            opener = this.pagesById.get(pageOptions.triggerPopupOnPageId);
        }
        // make the first page the active page
        if (!opener && !this.createdTargetIds.has(targetInfo.targetId)) {
            opener = this.pagesById.values().next().value;
        }
        const page = new Page_1.default(devtoolsSession, targetInfo.targetId, this, this.logger, opener, pageOptions);
        this.lastOpenedPage = page;
        this.waitForPageAttachedById.get(page.targetId)?.resolve(page);
        await page.isReady;
        this.emit('page', { page });
        return page;
    }
    onTargetDetached(targetId) {
        this.attachedTargetIds.delete(targetId);
        this.targetsById.delete(targetId);
        const page = this.pagesById.get(targetId);
        if (page) {
            this.pagesById.delete(targetId);
            this.pagesByTabId.delete(page.tabId);
            page.didClose();
            if (this.pagesById.size === 0) {
                this.emit('all-pages-closed');
            }
            return;
        }
        const devtoolsSession = this.devtoolsSessionsById.get(targetId);
        if (devtoolsSession) {
            this.onDevtoolsPanelDetached(devtoolsSession);
        }
    }
    onDevtoolsPanelAttached(devtoolsSession, targetInfo) {
        this.targetsById.set(targetInfo.targetId, targetInfo);
        this.devtoolsSessionsById.set(targetInfo.targetId, devtoolsSession);
        this.hooks.onDevtoolsPanelAttached?.(devtoolsSession, targetInfo).catch(() => null);
    }
    onDevtoolsPanelDetached(devtoolsSession) {
        this.hooks.onDevtoolsPanelDetached?.(devtoolsSession).catch(() => null);
    }
    async onSharedWorkerAttached(devtoolsSession, targetInfo) {
        const page = [...this.pagesById.values()].find(x => !x.isClosed) ?? this.pagesById.values().next().value;
        await page.onWorkerAttached(devtoolsSession, targetInfo);
    }
    beforeWorkerAttached(devtoolsSession, workerTargetId, pageTargetId) {
        this.devtoolsSessionLogger.subscribeToDevtoolsMessages(devtoolsSession, {
            sessionType: 'worker',
            pageTargetId,
            workerTargetId,
        });
    }
    onWorkerAttached(worker) {
        this.workersById.set(worker.id, worker);
        this.events.once(worker, 'close', () => this.workersById.delete(worker.id));
        this.emit('worker', { worker });
    }
    targetDestroyed(targetId) {
        this.attachedTargetIds.delete(targetId);
        const page = this.pagesById.get(targetId);
        if (page)
            page.didClose();
    }
    targetKilled(targetId, errorCode) {
        const page = this.pagesById.get(targetId);
        if (page)
            page.onTargetKilled(errorCode);
    }
    async attachToTarget(targetId) {
        // chrome 80 still needs you to manually attach
        if (!this.attachedTargetIds.has(targetId)) {
            await this.sendWithBrowserDevtoolsSession('Target.attachToTarget', {
                targetId,
                flatten: true,
            });
        }
    }
    async close() {
        if (this.isClosing)
            return this.isClosing;
        const resolvable = new Resolvable_1.default();
        this.isClosing = resolvable.promise;
        try {
            const logId = this.logger.info('BrowserContext.Closing');
            for (const waitingPage of this.waitForPageAttachedById.values()) {
                waitingPage.reject(new IPendingWaitEvent_1.CanceledPromiseError('BrowserContext shutting down'), true);
            }
            if (this.browser.devtoolsSession.isConnected()) {
                await Promise.all([...this.pagesById.values()].map(x => x.close()));
                // can only close with id
                if (this.id) {
                    // give it a second, but don't hang here
                    await Promise.race([
                        this.sendWithBrowserDevtoolsSession('Target.disposeBrowserContext', {
                            browserContextId: this.id,
                        }).catch(err => {
                            if (err instanceof IPendingWaitEvent_1.CanceledPromiseError)
                                return;
                            throw err;
                        }),
                        new Promise(resolve => setTimeout(resolve, 2e3)),
                    ]);
                }
            }
            // run just in case
            [...this.pagesById.values()].map(x => x.didClose());
            this.websocketMessages.cleanup();
            this.resources.cleanup();
            this.events.close();
            this.emit('close');
            this.devtoolsSessionLogger.close();
            this.removeAllListeners();
            this.cleanup();
            this.logger.stats('BrowserContext.Closed', { parentLogId: logId });
        }
        finally {
            resolvable.resolve();
        }
        return this.isClosing;
    }
    async getCookies(url) {
        const { cookies } = await this.sendWithBrowserDevtoolsSession('Storage.getCookies', {
            browserContextId: this.id,
        });
        return cookies
            .map(c => {
            return {
                name: c.name,
                value: c.value,
                secure: c.secure,
                sameSite: c.sameSite ?? 'None',
                sameParty: c.sameParty,
                expires: c.expires === -1 ? undefined : new Date(c.expires * 1000).toISOString(),
                httpOnly: c.httpOnly,
                path: c.path,
                domain: c.domain,
            };
        })
            .filter(c => {
            if (!url)
                return true;
            let domain = c.domain;
            if (!domain.startsWith('.'))
                domain = `.${domain}`;
            if (!`.${url.hostname}`.endsWith(domain))
                return false;
            if (!url.pathname.startsWith(c.path))
                return false;
            if (c.secure === true && url.protocol !== 'https:')
                return false;
            return true;
        });
    }
    async addCookies(cookies, origins) {
        const originUrls = (origins ?? []).map(x => new url_1.URL(x));
        const parsedCookies = [];
        for (const cookie of cookies) {
            (0, utils_1.assert)(cookie.name, 'Cookie should have a name');
            (0, utils_1.assert)(cookie.value !== undefined && cookie.value !== null, 'Cookie should have a value');
            (0, utils_1.assert)(cookie.domain || cookie.url, 'Cookie should have a domain or url');
            let expires = cookie.expires ?? -1;
            if (expires && typeof expires === 'string') {
                if (expires === '-1') {
                    expires = undefined;
                }
                else if (expires.match(/^[.\d]+$/)) {
                    expires = parseFloat(expires);
                    if (expires > 1e10)
                        expires /= 1e3;
                }
                else {
                    expires = new Date(expires).getTime() / 1e3;
                }
            }
            else if (expires && expires instanceof Date) {
                expires = expires.getTime() / 1e3;
            }
            const cookieToSend = {
                ...cookie,
                expires: expires,
            };
            if (!cookieToSend.url) {
                cookieToSend.url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
                const match = originUrls.find(x => {
                    return x.hostname.endsWith(cookie.domain);
                });
                if (match)
                    cookieToSend.url = match.href;
            }
            // chrome won't allow same site not for non-secure cookies
            if (!cookie.secure && cookie.sameSite === 'None') {
                delete cookieToSend.sameSite;
            }
            parsedCookies.push(cookieToSend);
        }
        await this.sendWithBrowserDevtoolsSession('Storage.setCookies', {
            cookies: parsedCookies,
            browserContextId: this.id,
        });
    }
    sendWithBrowserDevtoolsSession(method, params = {}) {
        return this.browser.devtoolsSession.send(method, params, this);
    }
    cleanup() {
        this.devtoolsSessionLogger = null;
        this.workersById.clear();
        this.pagesById.clear();
        this.pagesByTabId.clear();
        this.devtoolsSessionsById.clear();
        this.waitForPageAttachedById = null;
        this.creatingTargetPromises.length = null;
        this.commandMarker = null;
    }
}
exports.default = BrowserContext;
//# sourceMappingURL=BrowserContext.js.map