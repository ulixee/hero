"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const MitmRequestContext_1 = require("@ulixee/unblocked-agent-mitm/lib/MitmRequestContext");
const HeadersHandler_1 = require("@ulixee/unblocked-agent-mitm/handlers/HeadersHandler");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const tough_cookie_1 = require("tough-cookie");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
class Resources extends eventUtils_1.TypedEventEmitter {
    constructor(browserContext) {
        super();
        this.browserContext = browserContext;
        this.browserRequestIdToResources = new Map();
        this.hasRegisteredMitm = false;
        this.isCollecting = true;
        this.keepResourceBodies = false;
        this.resourcesById = new Map();
        this.cookiesByDomain = new Map();
        this.browserRequestIdToTabId = new Map();
        this.mitmErrorsByUrl = new Map();
        this.mitmRequestsPendingBrowserRequest = [];
        this.events = new EventSubscriber_1.default();
        this.logger = browserContext.logger.createChild(module);
    }
    getForTab(tabId) {
        const resources = [];
        for (const resource of this.resourcesById.values()) {
            if (resource.tabId === tabId)
                resources.push(resource);
        }
        return resources;
    }
    get(id) {
        return this.resourcesById.get(id);
    }
    onWebsocketHandshake(tabId, event) {
        this.browserRequestIdToTabId.set(event.browserRequestId, tabId);
    }
    connectToMitm(requestSession) {
        this.hasRegisteredMitm = true;
        this.events.on(requestSession, 'request', this.onMitmRequest.bind(this));
        this.events.on(requestSession, 'response', this.onMitmResponse.bind(this));
        this.events.on(requestSession, 'http-error', this.onMitmError.bind(this));
        requestSession.browserRequestMatcher = this;
        requestSession.hooks.push({
            beforeHttpResponse: this.beforeHttpResponse.bind(this),
        });
    }
    async beforeHttpResponse(resource) {
        if (HeadersHandler_1.default.isWorkerDest(resource, 'shared')) {
            const worker = this.browserContext.workersById.get(resource.browserRequestId);
            // chrome won't resolve this in time on chrome 97. works as of 103. Could possibly be more versions that don't work
            if (this.browserContext.browser.majorVersion < 98)
                return;
            await worker.isInitializationSent;
        }
    }
    setNavigationConnectTimeoutMs(url, timeoutMs) {
        this.navigationConnectTimeoutMs = timeoutMs;
    }
    cleanup() {
        this.mitmRequestsPendingBrowserRequest.length = 0;
        this.mitmErrorsByUrl.clear();
        this.resourcesById.clear();
        this.cookiesByDomain.clear();
        this.browserRequestIdToResources.clear();
        this.events.close();
        this.browserContext = null;
    }
    cancelPending() {
        for (const pending of this.mitmRequestsPendingBrowserRequest) {
            if (pending.browserRequestedPromise.isResolved)
                continue;
            pending.browserRequestedPromise.reject(new IPendingWaitEvent_1.CanceledPromiseError('Canceling: Mitm Request Session Closing'), true);
        }
        this.mitmRequestsPendingBrowserRequest.length = 0;
    }
    /////// BROWSER REQUEST ID MAPPING ///////////////////////////////////////////////////////////////////////////////////
    getBrowserRequestTabId(browserRequestId) {
        return this.browserRequestIdToTabId.get(browserRequestId);
    }
    getBrowserRequestLatestResource(browserRequestId) {
        const resources = this.browserRequestIdToResources.get(browserRequestId);
        if (!resources?.length) {
            return;
        }
        return resources[resources.length - 1];
    }
    trackBrowserRequestToResourceId(browserRequestId, resource) {
        if (!this.isCollecting)
            return;
        if (!browserRequestId)
            return;
        // NOTE: browserRequestId can be shared amongst redirects
        let resources = this.browserRequestIdToResources.get(browserRequestId);
        if (!resources) {
            resources = this.browserRequestIdToResources.set(browserRequestId, []).get(browserRequestId);
        }
        const replaceIdx = resources.findIndex(x => x.id === resource.id);
        if (replaceIdx !== -1)
            resources[replaceIdx] = resource;
        else
            resources.push(resource);
    }
    async createNewResourceIfUnseen(tabId, frameId, resourceRequest, getBody) {
        if (!this.isCollecting)
            return;
        if (this.browserRequestIdToResources.has(resourceRequest.browserRequestId))
            return;
        const ctx = MitmRequestContext_1.default.createFromResourceRequest(resourceRequest);
        const resourceDetails = MitmRequestContext_1.default.toEmittedResource(ctx);
        resourceDetails.frameId = frameId;
        if (!resourceRequest.browserServedFromCache) {
            resourceDetails.body = await getBody();
            if (resourceDetails.body) {
                delete resourceDetails.response.headers['content-encoding'];
                delete resourceDetails.response.headers['Content-Encoding'];
            }
        }
        return this.record(tabId, resourceDetails, 'browser-loaded');
    }
    /////// BROWSER REQUESTS /////////////////////////////////////////////////////////////////////////////////////////////
    onBrowserWillRequest(tabId, frameId, resource) {
        if (!this.isCollecting)
            return;
        this.browserRequestIdToTabId.set(resource.browserRequestId, tabId);
        let pendingRequest = this.findMatchingRequest(resource);
        if (pendingRequest &&
            pendingRequest.browserRequestedPromise.isResolved &&
            pendingRequest.browserRequestId) {
            // figure out how long ago this request was
            const requestTimeDiff = Math.abs(resource.requestTime - pendingRequest.requestTime);
            if (requestTimeDiff > 5e3)
                pendingRequest = null;
        }
        if (!pendingRequest) {
            if (!resource.url)
                return;
            pendingRequest = this.createPendingResource(resource);
        }
        this.updatePendingResource(resource, pendingRequest, tabId, frameId);
        this.emit('browser-will-request', {
            resource,
            mitmMatch: pendingRequest,
        });
        return pendingRequest;
    }
    onBrowserDidRequest(tabId, frameId, resource) {
        if (!this.isCollecting)
            return;
        this.browserRequestIdToTabId.set(resource.browserRequestId, tabId);
        const pendingRequest = this.mitmRequestsPendingBrowserRequest.find(x => x.browserRequestId === resource.browserRequestId);
        if (pendingRequest) {
            Object.assign(pendingRequest, getHeaderDetails(resource));
        }
        const mitmResourceNeedsResolve = this.findMatchingRequest(resource, 'hasMitmResourceId');
        if (mitmResourceNeedsResolve && !mitmResourceNeedsResolve.browserRequestedPromise.isResolved) {
            this.updatePendingResource(resource, mitmResourceNeedsResolve, tabId, frameId);
        }
    }
    onBrowserResourceLoaded(tabId, resource) {
        if (!this.isCollecting)
            return;
        const knownResource = this.getBrowserRequestLatestResource(resource.browserRequestId);
        if (knownResource) {
            if (!knownResource.response) {
                const ctx = MitmRequestContext_1.default.createFromResourceRequest(resource);
                const resourceDetails = MitmRequestContext_1.default.toEmittedResource(ctx);
                knownResource.response = resourceDetails.response;
            }
            knownResource.response.browserLoadedTime = resource.browserLoadedTime;
            this.emit('browser-loaded', {
                resourceId: knownResource.id,
                browserLoadedTime: resource.browserLoadedTime,
            });
            return true;
        }
        return this.matchesMitmError(tabId, resource.url?.href, resource.method, resource.browserRequestId, resource.requestTime);
    }
    onBrowserRequestFailed(tabId, frameId, resource, loadError) {
        if (!this.isCollecting)
            return null;
        this.browserRequestIdToTabId.set(resource.browserRequestId, tabId);
        const pendingRequest = this.mitmRequestsPendingBrowserRequest.find(x => x.browserRequestId === resource.browserRequestId) ?? this.findMatchingRequest(resource, 'hasMitmResourceId');
        let resourceId;
        if (pendingRequest) {
            this.updatePendingResource(resource, pendingRequest, tabId, frameId);
            resourceId = pendingRequest.mitmResourceId;
            if (resourceId)
                setTimeout(() => this.requestIsResolved(resourceId), 500).unref();
        }
        resourceId ??= this.getBrowserRequestLatestResource(resource.browserRequestId)?.id;
        // this function will resolve any pending resourceId for a navigation
        return this.emitBrowserRequestFailed(tabId, MitmRequestContext_1.default.toEmittedResource({ id: resourceId, ...resource }), loadError);
    }
    resolveBrowserRequest(mitmResource) {
        const pendingBrowserRequest = this.findMatchingRequest(mitmResource, 'noMitmResourceId');
        if (pendingBrowserRequest && !pendingBrowserRequest.browserRequestedPromise.isResolved) {
            pendingBrowserRequest.browserRequestedPromise.resolve();
        }
    }
    determineResourceType(mitmResource) {
        if (!this.isCollecting)
            return;
        const pendingBrowserRequest = this.findMatchingRequest(mitmResource, 'noMitmResourceId') ??
            // if no request from browser (and unmatched), queue a new one
            this.createPendingResource(mitmResource);
        pendingBrowserRequest.mitmResourceId = mitmResource.id;
        pendingBrowserRequest.isHttp2Push = mitmResource.isHttp2Push;
        if (mitmResource.resourceType === 'Websocket' ||
            // if navigate and empty, this is likely a download - it won't trigger in chrome
            (HeadersHandler_1.default.getRequestHeader(mitmResource, 'sec-fetch-mode') === 'navigate' &&
                HeadersHandler_1.default.getRequestHeader(mitmResource, 'sec-fetch-dest') === 'empty')) {
            pendingBrowserRequest.browserRequestedPromise.resolve(null);
        }
        mitmResource.browserHasRequested = pendingBrowserRequest.browserRequestedPromise.promise
            .then(() => {
            // eslint-disable-next-line promise/always-return
            if (!pendingBrowserRequest?.browserRequestId)
                return;
            mitmResource.resourceType = pendingBrowserRequest.resourceType;
            mitmResource.browserRequestId = pendingBrowserRequest.browserRequestId;
            mitmResource.hasUserGesture = pendingBrowserRequest.hasUserGesture;
            mitmResource.documentUrl = pendingBrowserRequest.documentUrl;
            mitmResource.browserFrameId = pendingBrowserRequest.frameId;
        })
            .catch(() => null);
    }
    /////// MITM REQUESTS ////////////////////////////////////////////////////////////////////////////////////////////////
    onInitialize(resource) {
        if (this.navigationConnectTimeoutMs !== undefined) {
            resource.connectTimeoutMillis = this.navigationConnectTimeoutMs;
        }
    }
    onMitmResponse(event) {
        if (!this.isCollecting)
            return;
        const defaultTabId = this.browserContext.lastOpenedPage?.tabId;
        const tabId = this.getBrowserRequestTabId(event.browserRequestId);
        const resource = this.record(tabId ?? defaultTabId, event, 'mitm-response');
        this.requestIsResolved(resource.id);
        const page = this.browserContext.pagesByTabId.get(resource.tabId ?? defaultTabId);
        page?.framesManager.checkForResolvedNavigation(event.browserRequestId, resource);
    }
    onMitmError(event) {
        if (!this.isCollecting)
            return;
        const { browserRequestId, request, resourceType, response } = event.request;
        let tabId = this.getBrowserRequestTabId(browserRequestId);
        const url = request?.url;
        const isDocument = resourceType === 'Document';
        if (isDocument && !tabId) {
            for (const page of this.browserContext.pagesById.values()) {
                const isMatch = page.framesManager.frameWithPendingNavigation(browserRequestId, url, response?.url);
                if (isMatch) {
                    tabId = page.tabId;
                    break;
                }
            }
        }
        // record errors
        const resource = this.onMitmRequestError(tabId, event, event.error);
        if (resource && tabId && isDocument) {
            const page = this.browserContext.pagesByTabId.get(tabId);
            page?.framesManager.checkForResolvedNavigation(browserRequestId, resource, event.error);
        }
    }
    onMitmRequest(request) {
        if (!this.isCollecting)
            return;
        this.logger.info('MitmRequest', {
            url: request.url.href,
            method: request.request.method,
            id: request.id,
        });
        // don't know the tab id at this point
        this.record(null, request, 'mitm-request');
    }
    onMitmRequestError(tabId, event, error) {
        if (!this.isCollecting)
            return;
        const request = event.request;
        const resource = this.resourceEventToMeta(tabId, request);
        this.emit('change', {
            tabId,
            resource,
            type: 'mitm-error',
            postData: request.postData,
            requestProcessingDetails: request,
            error,
        });
        if (!this.resourcesById.has(resource.id)) {
            this.resourcesById.set(resource.id, resource);
        }
        const url = resource.request?.url;
        if (!request.browserRequestId && url) {
            const existing = this.mitmErrorsByUrl.get(url) ?? [];
            existing.push({
                resourceId: resource.id,
                event,
            });
            this.mitmErrorsByUrl.set(url, existing);
        }
        return resource;
    }
    requestIsResolved(resourceId) {
        const matchIdx = this.mitmRequestsPendingBrowserRequest.findIndex(x => x.mitmResourceId === resourceId);
        if (matchIdx >= 0)
            this.mitmRequestsPendingBrowserRequest.splice(matchIdx, 1);
    }
    /////// STORAGE //////////////////////////////////////////////////////////////////////////////////////////////////////
    record(tabId, resourceEvent, type) {
        if (!this.isCollecting)
            return;
        const resource = this.resourceEventToMeta(tabId, resourceEvent);
        const resourceResponseEvent = resourceEvent;
        this.emit('change', {
            tabId,
            resource,
            type,
            postData: resourceResponseEvent.postData,
            body: resourceResponseEvent.body,
            requestProcessingDetails: resourceEvent,
        });
        if (!type.includes('request')) {
            this.resourcesById.set(resource.id, resource);
        }
        if (type.includes('response')) {
            const responseEvent = resourceEvent;
            this.recordCookies(tabId, responseEvent);
            if (this.keepResourceBodies) {
                resource.response.buffer = responseEvent.body;
            }
        }
        return resource;
    }
    emitBrowserRequestFailed(tabId, resourceFailedEvent, error) {
        const resourceId = resourceFailedEvent.id;
        if (!resourceId) {
            this.logger.warn('Resources.BrowserRequestFailedWithoutId', {
                resourceFailedEvent,
                error,
            });
            return;
        }
        try {
            const convertedMeta = this.resourceEventToMeta(tabId, resourceFailedEvent);
            const resource = this.resourcesById.get(resourceId);
            if (!resource) {
                this.resourcesById.set(convertedMeta.id, convertedMeta);
                this.emit('change', {
                    tabId,
                    type: 'browser-error',
                    resource: convertedMeta,
                    postData: resourceFailedEvent.postData,
                    requestProcessingDetails: resourceFailedEvent,
                    error,
                });
                return convertedMeta;
            }
            // if we already have this resource, we need to merge
            this.emit('merge', {
                resourceId,
                existingResource: resource,
                newResourceDetails: convertedMeta,
                requestProcessingDetails: resourceFailedEvent,
                error,
            });
            return resource;
        }
        catch (saveError) {
            this.logger.warn('Resources.captureResourceFailed::ErrorSaving', {
                error: saveError,
                resourceFailedEvent,
            });
        }
    }
    /////// MITM <-> BROWSER MATCHING ////////////////////////////////////////////////////////////////////////////////////
    updatePendingResource(httpResourceLoad, browserRequest, tabId, frameId) {
        browserRequest.tabId ??= tabId;
        browserRequest.frameId ??= frameId;
        browserRequest.browserLoadedTime ??= httpResourceLoad.browserLoadedTime;
        browserRequest.browserRequestId = httpResourceLoad.browserRequestId;
        browserRequest.documentUrl = httpResourceLoad.documentUrl;
        browserRequest.resourceType = httpResourceLoad.resourceType;
        browserRequest.hasUserGesture = httpResourceLoad.hasUserGesture;
        browserRequest.browserRequestedPromise.resolve();
    }
    createPendingResource(request) {
        const resource = {
            url: request.url.href,
            method: request.method,
            requestTime: request.requestTime,
            browserRequestedPromise: new Resolvable_1.default(5e3, `BrowserRequestMatcher.ResourceNotResolved: ${request.method}: ${request.url}`),
            ...getHeaderDetails(request),
        };
        this.mitmRequestsPendingBrowserRequest.push(resource);
        return resource;
    }
    findMatchingRequest(resourceToMatch, filter) {
        const { method } = resourceToMatch;
        const url = resourceToMatch.url?.href;
        if (!url)
            return;
        let matches = this.mitmRequestsPendingBrowserRequest.filter(x => {
            return x.url === url && x.method === method;
        });
        if (resourceToMatch.browserRequestId) {
            matches = matches.filter(x => {
                if (x.browserRequestId)
                    return x.browserRequestId === resourceToMatch.browserRequestId;
                return true;
            });
        }
        if (filter === 'noMitmResourceId') {
            matches = matches.filter(x => !x.mitmResourceId);
        }
        if (filter === 'hasMitmResourceId') {
            matches = matches.filter(x => !!x.mitmResourceId);
        }
        // if http2 push, we don't know what referer/origin headers the browser will use
        // NOTE: we do this because it aligns the browserRequestId. We don't need header info
        const h2Push = matches.find(x => x.isHttp2Push);
        if (h2Push)
            return h2Push;
        if (resourceToMatch.isHttp2Push && matches.length)
            return matches[0];
        if (method === 'OPTIONS') {
            const origin = HeadersHandler_1.default.getRequestHeader(resourceToMatch, 'origin');
            return matches.find(x => x.origin === origin);
        }
        // if we have sec-fetch-dest headers, make sure they match
        const secDest = HeadersHandler_1.default.getRequestHeader(resourceToMatch, 'sec-fetch-dest');
        if (secDest) {
            matches = matches.filter(x => x.secFetchDest === secDest);
        }
        // if we have sec-fetch-dest headers, make sure they match
        const secSite = HeadersHandler_1.default.getRequestHeader(resourceToMatch, 'sec-fetch-site');
        if (secSite) {
            matches = matches.filter(x => x.secFetchSite === secSite);
        }
        if (matches.length === 1)
            return matches[0];
        // otherwise, use referer
        const referer = HeadersHandler_1.default.getRequestHeader(resourceToMatch, 'referer');
        return matches.find(x => x.referer === referer);
    }
    matchesMitmError(tabId, url, method, browserRequestId, requestTime) {
        // first check if this is a mitm error
        const errorsMatchingUrl = this.mitmErrorsByUrl.get(url);
        if (!errorsMatchingUrl)
            return false;
        // if this resource error-ed out,
        for (const entry of errorsMatchingUrl) {
            const { event, resourceId } = entry;
            const request = event?.request?.request;
            const isMatch = request?.method === method && Math.abs(request.timestamp - requestTime) < 500;
            if (!isMatch)
                continue;
            const idx = errorsMatchingUrl.indexOf(entry);
            errorsMatchingUrl.splice(idx, 1);
            const resource = this.resourcesById.get(resourceId);
            if (resource) {
                resource.tabId = tabId;
                this.trackBrowserRequestToResourceId(browserRequestId, resource);
                this.emit('browser-requested', { resourceId, browserRequestId, tabId });
            }
            return true;
        }
        return false;
    }
    resourceEventToMeta(tabId, resourceEvent) {
        const { request, response, resourceType, browserRequestId, frameId, redirectedToUrl } = resourceEvent;
        const resource = {
            id: resourceEvent.id,
            tabId,
            frameId,
            url: request.url,
            receivedAtCommandId: this.browserContext.commandMarker.lastId,
            type: resourceType,
            isRedirect: !!redirectedToUrl,
            documentUrl: resourceEvent.documentUrl,
            request: {
                ...request,
            },
        };
        if (response?.statusCode || response?.browserServedFromCache || response?.browserLoadFailure) {
            resource.response = response;
            if (response.url)
                resource.url = response.url;
            else
                resource.response.url = request.url;
        }
        this.trackBrowserRequestToResourceId(browserRequestId, resource);
        return resource;
    }
    recordCookies(tabId, responseEvent) {
        const { response } = responseEvent;
        if (!response?.headers)
            return;
        let setCookie = response.headers['set-cookie'] ?? response.headers['Set-Cookie'];
        if (!setCookie)
            return;
        if (!Array.isArray(setCookie))
            setCookie = [setCookie];
        const defaultDomain = responseEvent.url.host;
        for (const cookieHeader of setCookie) {
            if (cookieHeader === '')
                continue;
            const cookie = tough_cookie_1.Cookie.parse(cookieHeader, { loose: true });
            let domain = cookie.domain || defaultDomain;
            // restore stripped leading .
            if (cookie.domain && cookieHeader.toLowerCase().includes(`domain=.${domain}`)) {
                domain = `.${domain}`;
            }
            if (!this.cookiesByDomain.has(domain))
                this.cookiesByDomain.set(domain, {});
            const domainCookies = this.cookiesByDomain.get(domain);
            let action = 'add';
            const existing = domainCookies[cookie.key];
            if (existing) {
                if (cookie.expires && cookie.expires < new Date()) {
                    action = 'remove';
                }
                else {
                    action = 'update';
                }
            }
            let finalCookie;
            if (action === 'remove') {
                delete domainCookies[cookie.key];
            }
            else {
                finalCookie = {
                    name: cookie.key,
                    sameSite: cookie.sameSite,
                    url: responseEvent.url.href,
                    domain,
                    path: cookie.path,
                    httpOnly: cookie.httpOnly,
                    value: cookie.value,
                    secure: cookie.secure,
                    expires: cookie.expires instanceof Date ? cookie.expires.toISOString() : undefined,
                };
                if (areCookiesEqual(existing, finalCookie))
                    continue;
                domainCookies[finalCookie.name] = finalCookie;
            }
            this.emit('cookie-change', {
                tabId,
                frameId: responseEvent.frameId,
                action,
                url: responseEvent.url,
                timestamp: response.browserLoadedTime ?? response.timestamp,
                cookie: finalCookie,
            });
        }
    }
    static translateResourceError(resource) {
        if (resource.browserLoadFailure) {
            return new Error(resource.browserLoadFailure);
        }
        if (resource.browserBlockedReason) {
            return new Error(`Resource blocked: "${resource.browserBlockedReason}"`);
        }
        if (resource.browserCanceled) {
            return new Error('Load canceled');
        }
        return new Error('Resource failed to load, but the reason was not provided by devtools.');
    }
}
exports.default = Resources;
function getHeaderDetails(httpResourceLoad) {
    const origin = HeadersHandler_1.default.getRequestHeader(httpResourceLoad, 'origin');
    const referer = HeadersHandler_1.default.getRequestHeader(httpResourceLoad, 'referer');
    const secFetchDest = HeadersHandler_1.default.getRequestHeader(httpResourceLoad, 'sec-fetch-dest');
    const secFetchSite = HeadersHandler_1.default.getRequestHeader(httpResourceLoad, 'sec-fetch-site');
    return { origin, referer, secFetchDest, secFetchSite };
}
function areCookiesEqual(a, b) {
    if ((a && !b) || (b && !a))
        return false;
    if (a.name !== b.name)
        return false;
    if (a.value !== b.value)
        return false;
    if (a.expires !== b.expires)
        return false;
    if (a.path !== b.path)
        return false;
    if (a.secure !== b.secure)
        return false;
    if (a.sameParty !== b.sameParty)
        return false;
    if (a.httpOnly !== b.httpOnly)
        return false;
    return true;
}
//# sourceMappingURL=Resources.js.map