"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IResourceType_1 = require("@ulixee/unblocked-specification/agent/net/IResourceType");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const utils_1 = require("@ulixee/commons/lib/utils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const url_1 = require("url");
const mbBytes = 1028 * 1028;
class NetworkManager extends eventUtils_1.TypedEventEmitter {
    constructor(devtoolsSession, logger, proxyConnectionOptions, secretKey) {
        super();
        this.secretKey = secretKey;
        this.attemptedAuthentications = new Set();
        this.redirectsById = new Map();
        this.requestsById = new Map();
        this.requestPublishingById = new Map();
        this.navigationRequestIdsToLoaderId = new Map();
        this.requestIdsToIgnore = new Set();
        this.events = new EventSubscriber_1.default();
        this.isChromeRetainingResources = false;
        this.devtools = devtoolsSession;
        this.logger = logger.createChild(module);
        this.proxyConnectionOptions = proxyConnectionOptions;
        (0, utils_1.bindFunctions)(this);
        const session = this.devtools;
        this.events.on(session, 'Fetch.requestPaused', this.onRequestPaused);
        this.events.on(session, 'Fetch.authRequired', this.onAuthRequired);
        this.events.on(session, 'Network.webSocketWillSendHandshakeRequest', this.onWebsocketHandshake);
        this.events.on(session, 'Network.webSocketCreated', this.onWebSocketCreated.bind(this));
        this.events.on(session, 'Network.webSocketFrameReceived', this.onWebsocketFrame.bind(this, true));
        this.events.on(session, 'Network.webSocketFrameSent', this.onWebsocketFrame.bind(this, false));
        this.events.on(session, 'Network.requestWillBeSent', this.onNetworkRequestWillBeSent);
        this.events.on(session, 'Network.requestWillBeSentExtraInfo', this.onNetworkRequestWillBeSentExtraInfo);
        this.events.on(session, 'Network.responseReceived', this.onNetworkResponseReceived);
        this.events.on(session, 'Network.loadingFinished', this.onLoadingFinished);
        this.events.on(session, 'Network.loadingFailed', this.onLoadingFailed);
        this.events.on(session, 'Network.requestServedFromCache', this.onNetworkRequestServedFromCache);
    }
    emit(eventType, event) {
        if (this.parentManager) {
            this.parentManager.emit(eventType, event);
        }
        return super.emit(eventType, event);
    }
    async initialize() {
        if (this.mockNetworkRequests) {
            return this.devtools
                .send('Fetch.enable', {
                handleAuthRequests: !!this.proxyConnectionOptions?.password,
            })
                .catch(err => err);
        }
        const maxResourceBufferSize = this.proxyConnectionOptions?.address ? mbBytes : 5 * mbBytes; // 5mb max
        if (maxResourceBufferSize > 0)
            this.isChromeRetainingResources = true;
        const patternsToIntercepts = [
            { urlPattern: 'http://hero.localhost/*' },
            { urlPattern: 'data://hero.localhost/*' },
        ];
        if (this.proxyConnectionOptions?.password) {
            // Pattern needs to match website url (not proxy url), so wildcard is only option we really have here
            patternsToIntercepts.push({ urlPattern: '*' });
        }
        const errors = await Promise.all([
            this.devtools
                .send('Network.enable', {
                maxPostDataSize: 0,
                maxResourceBufferSize,
                maxTotalBufferSize: maxResourceBufferSize * 5,
            })
                .catch(err => err),
            this.devtools
                .send('Fetch.enable', {
                handleAuthRequests: !!this.proxyConnectionOptions?.password,
                patterns: patternsToIntercepts,
            })
                .catch(err => err),
            // this.devtools.send('Security.setIgnoreCertificateErrors', { ignore: true }),
        ]);
        for (const error of errors) {
            if (error && error instanceof Error)
                throw error;
        }
    }
    async setNetworkInterceptor(mockNetworkRequests, disableSessionLogging) {
        this.mockNetworkRequests = mockNetworkRequests;
        const promises = [];
        if (disableSessionLogging) {
            promises.push(this.devtools.send('Network.disable'));
        }
        if (mockNetworkRequests) {
            promises.push(this.devtools.send('Fetch.enable', {
                handleAuthRequests: !!this.proxyConnectionOptions?.password,
            }));
        }
        else {
            promises.push(this.devtools.send('Fetch.disable'));
        }
        await Promise.all(promises);
    }
    close() {
        this.events.close();
        this.cancelPendingEvents('NetworkManager closed');
    }
    reset() {
        this.attemptedAuthentications.clear();
        this.navigationRequestIdsToLoaderId.clear();
        this.redirectsById.clear();
        this.requestsById.clear();
        this.requestPublishingById.clear();
        this.navigationRequestIdsToLoaderId.clear();
    }
    initializeFromParent(parentManager) {
        this.parentManager = parentManager;
        this.mockNetworkRequests = parentManager.mockNetworkRequests;
        return this.initialize();
    }
    monotonicTimeToUnix(monotonicTime) {
        if (this.monotonicOffsetTime)
            return 1e3 * (monotonicTime + this.monotonicOffsetTime);
    }
    onAuthRequired(event) {
        const authChallengeResponse = {
            response: "Default" /* AuthChallengeResponse.Default */,
        };
        if (this.attemptedAuthentications.has(event.requestId)) {
            authChallengeResponse.response = "CancelAuth" /* AuthChallengeResponse.CancelAuth */;
        }
        else if (event.authChallenge.source === 'Proxy' && this.proxyConnectionOptions?.password) {
            this.attemptedAuthentications.add(event.requestId);
            authChallengeResponse.response = "ProvideCredentials" /* AuthChallengeResponse.ProvideCredentials */;
            authChallengeResponse.username = this.proxyConnectionOptions.username ?? 'browser-chrome';
            authChallengeResponse.password = this.proxyConnectionOptions.password;
        }
        this.devtools
            .send('Fetch.continueWithAuth', {
            requestId: event.requestId,
            authChallengeResponse,
        })
            .catch(error => {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            this.logger.info('NetworkManager.continueWithAuthError', {
                error,
                requestId: event.requestId,
                url: event.request.url,
            });
        });
    }
    async onRequestPaused(networkRequest) {
        try {
            let continueDetails = {
                requestId: networkRequest.requestId,
            };
            // Internal hero requests
            if (networkRequest.request.url.includes(`hero.localhost/?secretKey=${this.secretKey}`)) {
                return await this.devtools.send('Fetch.fulfillRequest', {
                    requestId: networkRequest.requestId,
                    responseCode: 200,
                });
            }
            if (this.mockNetworkRequests) {
                const response = await this.mockNetworkRequests(networkRequest);
                if (response) {
                    if (response.body) {
                        return await this.devtools.send('Fetch.fulfillRequest', response);
                    }
                    if (response.url) {
                        continueDetails = response;
                        if (continueDetails.url)
                            networkRequest.request.url = continueDetails.url;
                        if (continueDetails.headers) {
                            for (const [key, value] of Object.entries(continueDetails.headers)) {
                                networkRequest.request.headers[key] = value;
                            }
                        }
                    }
                }
            }
            await this.devtools.send('Fetch.continueRequest', continueDetails);
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            this.logger.info('NetworkManager.continueRequestError', {
                error,
                requestId: networkRequest.requestId,
                url: networkRequest.request.url,
            });
        }
        let resource;
        try {
            // networkId corresponds to onNetworkRequestWillBeSent
            resource = {
                browserRequestId: networkRequest.networkId ?? networkRequest.requestId,
                resourceType: (0, IResourceType_1.getResourceTypeForChromeValue)(networkRequest.resourceType, networkRequest.request.method),
                url: new url_1.URL(networkRequest.request.url),
                method: networkRequest.request.method,
                isSSL: networkRequest.request.url.startsWith('https'),
                isFromRedirect: false,
                isUpgrade: false,
                isHttp2Push: false,
                isServerHttp2: false,
                requestTime: Date.now(),
                protocol: null,
                hasUserGesture: false,
                documentUrl: networkRequest.request.headers.Referer,
                frameId: networkRequest.frameId,
            };
        }
        catch (error) {
            this.logger.warn('NetworkManager.onRequestPausedError', {
                error,
                url: networkRequest.request.url,
                browserRequestId: networkRequest.requestId,
            });
            return;
        }
        const existing = this.requestsById.get(resource.browserRequestId);
        if (existing) {
            if (existing.url === resource.url) {
                resource.requestHeaders = existing.requestHeaders ?? {};
            }
            if (existing.resourceType) {
                resource.resourceType = existing.resourceType;
            }
            resource.redirectedFromUrl = existing.redirectedFromUrl;
        }
        this.mergeRequestHeaders(resource, networkRequest.request.headers);
        if (networkRequest.networkId && !this.requestsById.has(networkRequest.networkId)) {
            this.requestsById.set(networkRequest.networkId, resource);
        }
        if (networkRequest.requestId !== networkRequest.networkId) {
            this.requestsById.set(networkRequest.requestId, resource);
        }
        // requests from service workers (and others?) will never register with RequestWillBeSentEvent
        // -- they don't have networkIds
        this.emitResourceRequested(resource.browserRequestId);
    }
    onNetworkRequestWillBeSent(networkRequest) {
        if (this.requestIdsToIgnore.has(networkRequest.requestId))
            return;
        const url = networkRequest.request.url;
        if (url.includes(`hero.localhost/?secretKey=${this.secretKey}`)) {
            this.emit('internal-request', { request: networkRequest });
            this.addRequestIdToIgnore(networkRequest.requestId);
            return;
        }
        if (!this.monotonicOffsetTime)
            this.monotonicOffsetTime = networkRequest.wallTime - networkRequest.timestamp;
        const redirectedFromUrl = networkRequest.redirectResponse?.url;
        const isNavigation = networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';
        if (isNavigation) {
            this.navigationRequestIdsToLoaderId.set(networkRequest.requestId, networkRequest.loaderId);
        }
        let resource;
        try {
            resource = {
                url: new url_1.URL(networkRequest.request.url),
                isSSL: networkRequest.request.url.startsWith('https'),
                isFromRedirect: !!redirectedFromUrl,
                isUpgrade: false,
                isHttp2Push: false,
                isServerHttp2: false,
                requestTime: networkRequest.wallTime * 1e3,
                protocol: null,
                browserRequestId: networkRequest.requestId,
                resourceType: (0, IResourceType_1.getResourceTypeForChromeValue)(networkRequest.type, networkRequest.request.method),
                method: networkRequest.request.method,
                hasUserGesture: networkRequest.hasUserGesture,
                documentUrl: networkRequest.documentURL,
                redirectedFromUrl,
                frameId: networkRequest.frameId,
            };
        }
        catch (error) {
            this.logger.warn('NetworkManager.onNetworkRequestWillBeSentError', {
                error,
                url: networkRequest.request.url,
                browserRequestId: networkRequest.requestId,
            });
            return;
        }
        const publishing = this.getPublishingForRequestId(resource.browserRequestId, true);
        publishing.hasRequestWillBeSentEvent = true;
        const existing = this.requestsById.get(resource.browserRequestId);
        const isNewRedirect = redirectedFromUrl && existing && existing.url !== resource.url;
        // NOTE: same requestId will be used in devtools for redirected resources
        if (existing) {
            if (isNewRedirect) {
                const existingRedirects = this.redirectsById.get(resource.browserRequestId) ?? [];
                existing.redirectedToUrl = networkRequest.request.url;
                existing.responseHeaders = networkRequest.redirectResponse.headers;
                existing.status = networkRequest.redirectResponse.status;
                existing.statusMessage = networkRequest.redirectResponse.statusText;
                this.redirectsById.set(resource.browserRequestId, [...existingRedirects, existing]);
                publishing.isPublished = false;
                clearTimeout(publishing.emitTimeout);
                publishing.emitTimeout = undefined;
            }
            else {
                // preserve headers and frameId from a fetch or networkWillRequestExtraInfo
                resource.requestHeaders = existing.requestHeaders ?? {};
            }
        }
        this.requestsById.set(resource.browserRequestId, resource);
        this.mergeRequestHeaders(resource, networkRequest.request.headers);
        this.emitResourceRequested(resource.browserRequestId);
    }
    onNetworkRequestWillBeSentExtraInfo(networkRequest) {
        const requestId = networkRequest.requestId;
        if (this.requestIdsToIgnore.has(requestId))
            return;
        let resource = this.requestsById.get(requestId);
        if (!resource) {
            resource = {};
            this.requestsById.set(requestId, resource);
        }
        this.mergeRequestHeaders(resource, networkRequest.headers);
        const hasNetworkRequest = this.requestPublishingById.get(requestId)?.hasRequestWillBeSentEvent === true;
        if (hasNetworkRequest) {
            this.doEmitResourceRequested(resource.browserRequestId);
        }
    }
    mergeRequestHeaders(resource, requestHeaders) {
        resource.requestHeaders ??= {};
        for (const [key, value] of Object.entries(requestHeaders)) {
            const titleKey = `${key
                .split('-')
                .map(x => (x[0] ?? '').toUpperCase() + x.slice(1))
                .join('-')}`;
            if (resource.requestHeaders[titleKey] && titleKey !== key) {
                delete resource.requestHeaders[titleKey];
            }
            resource.requestHeaders[key] = value;
        }
    }
    emitResourceRequested(browserRequestId) {
        if (this.requestIdsToIgnore.has(browserRequestId))
            return;
        const resource = this.requestsById.get(browserRequestId);
        if (!resource)
            return;
        const publishing = this.getPublishingForRequestId(browserRequestId, true);
        // if we're already waiting, go ahead and publish now
        if (publishing.emitTimeout && !publishing.isPublished) {
            this.doEmitResourceRequested(browserRequestId);
            return;
        }
        // give it a small period to add extra info. no network id means it's running outside the normal "requestWillBeSent" flow
        publishing.emitTimeout = setTimeout(this.doEmitResourceRequested, 200, browserRequestId).unref();
    }
    doEmitResourceRequested(browserRequestId) {
        if (this.requestIdsToIgnore.has(browserRequestId))
            return;
        const resource = this.requestsById.get(browserRequestId);
        if (!resource)
            return false;
        if (!resource.url)
            return false;
        const publishing = this.getPublishingForRequestId(browserRequestId, true);
        clearTimeout(publishing.emitTimeout);
        publishing.emitTimeout = undefined;
        const event = {
            resource,
            isDocumentNavigation: this.navigationRequestIdsToLoaderId.has(browserRequestId),
            frameId: resource.frameId,
            redirectedFromUrl: resource.redirectedFromUrl,
            loaderId: this.navigationRequestIdsToLoaderId.get(browserRequestId),
        };
        // NOTE: same requestId will be used in devtools for redirected resources
        if (!publishing.isPublished) {
            publishing.isPublished = true;
            this.emit('resource-will-be-requested', event);
        }
        else if (!publishing.isDetailsEmitted) {
            publishing.isDetailsEmitted = true;
            this.emit('resource-was-requested', event);
        }
    }
    onNetworkResponseReceived(event) {
        if (this.requestIdsToIgnore.has(event.requestId))
            return;
        const { response, requestId, loaderId, frameId, type } = event;
        const resource = this.requestsById.get(requestId);
        if (resource) {
            resource.responseHeaders = response.headers;
            resource.status = response.status;
            resource.statusMessage = response.statusText;
            resource.remoteAddress = `${response.remoteIPAddress}:${response.remotePort}`;
            resource.protocol = response.protocol;
            resource.responseUrl = response.url;
            resource.responseTime = response.responseTime;
            if (response.fromDiskCache)
                resource.browserServedFromCache = 'disk';
            if (response.fromServiceWorker)
                resource.browserServedFromCache = 'service-worker';
            if (response.fromPrefetchCache)
                resource.browserServedFromCache = 'prefetch';
            if (response.requestHeaders)
                this.mergeRequestHeaders(resource, response.requestHeaders);
            if (!resource.url) {
                try {
                    resource.url = new url_1.URL(response.url);
                }
                catch { }
                resource.frameId = frameId;
                resource.browserRequestId = requestId;
            }
            if (!this.requestPublishingById.get(requestId)?.isPublished && resource.url?.href) {
                this.doEmitResourceRequested(requestId);
            }
        }
        const isNavigation = requestId === loaderId && type === 'Document';
        if (isNavigation) {
            this.emit('navigation-response', {
                frameId,
                browserRequestId: requestId,
                status: response.status,
                location: response.headers.location,
                url: response.url,
                loaderId: event.loaderId,
                timestamp: response.responseTime,
            });
        }
    }
    onNetworkRequestServedFromCache(event) {
        if (this.requestIdsToIgnore.has(event.requestId))
            return;
        const { requestId } = event;
        const resource = this.requestsById.get(requestId);
        if (resource) {
            resource.browserServedFromCache = 'memory';
            setTimeout(() => this.emitLoaded(requestId, resource.requestTime), 500).unref();
        }
    }
    onLoadingFailed(event) {
        if (this.requestIdsToIgnore.has(event.requestId))
            return;
        const { requestId, canceled, blockedReason, errorText, timestamp } = event;
        const resource = this.requestsById.get(requestId);
        if (resource) {
            if (!resource.url || !resource.requestTime) {
                return;
            }
            if (canceled)
                resource.browserCanceled = true;
            if (blockedReason)
                resource.browserBlockedReason = blockedReason;
            if (errorText)
                resource.browserLoadFailure = errorText;
            resource.browserLoadedTime = this.monotonicTimeToUnix(timestamp);
            if (!this.requestPublishingById.get(requestId)?.isPublished) {
                this.doEmitResourceRequested(requestId);
            }
            this.emit('resource-failed', {
                resource,
            });
            this.redirectsById.delete(requestId);
            this.requestsById.delete(requestId);
            this.requestPublishingById.delete(requestId);
        }
    }
    onLoadingFinished(event) {
        if (this.requestIdsToIgnore.has(event.requestId))
            return;
        const { requestId, timestamp } = event;
        const eventTime = this.monotonicTimeToUnix(timestamp);
        this.emitLoaded(requestId, eventTime);
    }
    emitLoaded(id, timestamp) {
        if (this.requestIdsToIgnore.has(id))
            return;
        const resource = this.requestsById.get(id);
        if (resource) {
            if (!this.requestPublishingById.get(id)?.isPublished)
                this.emitResourceRequested(id);
            this.requestsById.delete(id);
            this.requestPublishingById.delete(id);
            const loaderId = this.navigationRequestIdsToLoaderId.get(id);
            resource.browserLoadedTime = timestamp;
            if (this.redirectsById.has(id)) {
                for (const redirect of this.redirectsById.get(id)) {
                    redirect.browserLoadedTime = timestamp;
                    this.emit('resource-loaded', {
                        resource: redirect,
                        frameId: redirect.frameId,
                        loaderId,
                        body: () => Promise.resolve(Buffer.from('')),
                    });
                }
                this.redirectsById.delete(id);
            }
            const body = this.downloadRequestBody.bind(this, id);
            this.emit('resource-loaded', {
                resource,
                frameId: resource.frameId,
                loaderId,
                body,
            });
        }
    }
    async downloadRequestBody(requestId) {
        if (this.requestIdsToIgnore.has(requestId))
            return;
        if (this.isChromeRetainingResources === false || !this.devtools.isConnected()) {
            return null;
        }
        try {
            const body = await this.devtools.send('Network.getResponseBody', {
                requestId,
            });
            return Buffer.from(body.body, body.base64Encoded ? 'base64' : undefined);
        }
        catch (e) {
            return null;
        }
    }
    getPublishingForRequestId(id, createIfNull = false) {
        if (this.requestIdsToIgnore.has(id))
            return;
        const publishing = this.requestPublishingById.get(id);
        if (publishing)
            return publishing;
        if (createIfNull) {
            this.requestPublishingById.set(id, { hasRequestWillBeSentEvent: false });
            return this.requestPublishingById.get(id);
        }
    }
    /////// WEBSOCKET EVENT HANDLERS /////////////////////////////////////////////////////////////////
    onWebSocketCreated(_event) { }
    onWebsocketHandshake(handshake) {
        if (this.requestIdsToIgnore.has(handshake.requestId))
            return;
        this.emit('websocket-handshake', {
            browserRequestId: handshake.requestId,
            headers: handshake.request.headers,
        });
    }
    onWebsocketFrame(isFromServer, event) {
        if (this.requestIdsToIgnore.has(event.requestId))
            return;
        const browserRequestId = event.requestId;
        const { opcode, payloadData } = event.response;
        const message = opcode === 1 ? payloadData : Buffer.from(payloadData, 'base64');
        this.emit('websocket-frame', {
            message,
            browserRequestId,
            isFromServer,
            timestamp: this.monotonicTimeToUnix(event.timestamp),
        });
    }
    /////// UTILS ///////////
    addRequestIdToIgnore(id) {
        this.requestIdsToIgnore.add(id);
        while (this.requestIdsToIgnore.size > 1000) {
            const value = this.requestIdsToIgnore.values().next().value;
            this.requestIdsToIgnore.delete(value);
        }
    }
}
exports.default = NetworkManager;
//# sourceMappingURL=NetworkManager.js.map