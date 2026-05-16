"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const OriginType_1 = require("@ulixee/unblocked-specification/agent/net/OriginType");
const url_1 = require("url");
const CacheHandler_1 = require("../handlers/CacheHandler");
const HeadersHandler_1 = require("../handlers/HeadersHandler");
const ResourceState_1 = require("../interfaces/ResourceState");
const Utils_1 = require("./Utils");
class MitmRequestContext {
    static createFromResourceRequest(resourceLoadDetails) {
        return {
            id: this.nextId(),
            ...resourceLoadDetails,
            requestOriginalHeaders: Object.freeze({ ...resourceLoadDetails.requestHeaders }),
            didInterceptResource: !!resourceLoadDetails.browserBlockedReason,
            cacheHandler: null,
            clientToProxyRequest: null,
            stateChanges: new Map([[ResourceState_1.default.End, new Date()]]),
            setState() { },
        };
    }
    static create(params, responseCache) {
        const { isSSL, proxyToClientResponse, clientToProxyRequest, requestSession, isUpgrade } = params;
        const protocol = isUpgrade ? 'ws' : 'http';
        const expectedProtocol = `${protocol}${isSSL ? 's' : ''}:`;
        let url;
        if (clientToProxyRequest.url.startsWith('http://') ||
            clientToProxyRequest.url.startsWith('https://') ||
            clientToProxyRequest.url.startsWith('ws://') ||
            clientToProxyRequest.url.startsWith('wss://')) {
            url = new url_1.URL(clientToProxyRequest.url);
        }
        else {
            let providedHost = (clientToProxyRequest.headers.host ??
                clientToProxyRequest.headers[':authority'] ??
                '');
            if (providedHost.endsWith('/'))
                providedHost = providedHost.slice(0, -1);
            if (providedHost.startsWith('http://') ||
                providedHost.startsWith('https://') ||
                providedHost.startsWith('ws://') ||
                providedHost.startsWith('wss://')) {
                providedHost = providedHost.split('://').slice(1).join('://');
            }
            // build urls in two steps because URL constructor will bomb on valid WHATWG urls with path
            url = new url_1.URL(`${expectedProtocol}//${providedHost}${clientToProxyRequest.url}`);
        }
        if (url.protocol !== expectedProtocol) {
            url.protocol = expectedProtocol;
        }
        const state = new Map();
        const requestHeaders = (0, Utils_1.parseRawHeaders)(clientToProxyRequest.rawHeaders);
        const ctx = {
            id: this.nextId(),
            isSSL,
            isUpgrade,
            isServerHttp2: false,
            isHttp2Push: false,
            method: clientToProxyRequest.method,
            url,
            requestSession,
            requestHeaders,
            requestOriginalHeaders: Object.freeze((0, Utils_1.parseRawHeaders)(clientToProxyRequest.rawHeaders)),
            clientToProxyRequest,
            proxyToClientResponse,
            requestTime: Date.now(),
            protocol: clientToProxyRequest.socket?.alpnProtocol || 'http/1.1',
            documentUrl: clientToProxyRequest.headers.origin,
            originType: this.getOriginType(url, requestHeaders),
            didInterceptResource: false,
            cacheHandler: null,
            stateChanges: state,
            setState(stateStep) {
                state.set(stateStep, new Date());
                requestSession.emit('resource-state', { context: ctx, state: stateStep });
            },
            events: new EventSubscriber_1.default(),
        };
        if (protocol === 'ws') {
            ctx.resourceType = 'Websocket';
        }
        ctx.cacheHandler = new CacheHandler_1.default(responseCache, ctx);
        requestSession.browserRequestMatcher?.onInitialize(ctx);
        return ctx;
    }
    static createFromHttp2Push(parentContext, rawHeaders) {
        const requestHeaders = (0, Utils_1.parseRawHeaders)(rawHeaders);
        const url = new url_1.URL(`${parentContext.url.protocol}//${requestHeaders[':authority']}${requestHeaders[':path']}`);
        const state = new Map();
        const { requestSession } = parentContext;
        const ctx = {
            id: this.nextId(),
            url,
            method: requestHeaders[':method'],
            isServerHttp2: parentContext.isServerHttp2,
            requestSession,
            protocol: parentContext.protocol,
            remoteAddress: parentContext.remoteAddress,
            localAddress: parentContext.localAddress,
            originType: parentContext.originType,
            isUpgrade: false,
            isSSL: parentContext.isSSL,
            hasUserGesture: parentContext.hasUserGesture,
            isHttp2Push: true,
            requestOriginalHeaders: (0, Utils_1.parseRawHeaders)(rawHeaders),
            requestHeaders,
            responseHeaders: null,
            responseUrl: null,
            responseTrailers: null,
            clientToProxyRequest: null,
            proxyToClientResponse: null,
            serverToProxyResponseStream: null,
            proxyToServerRequest: null,
            requestTime: Date.now(),
            didInterceptResource: false,
            cacheHandler: null,
            stateChanges: state,
            setState(stateStep) {
                state.set(stateStep, new Date());
                requestSession.emit('resource-state', { context: ctx, state: stateStep });
            },
            events: new EventSubscriber_1.default(),
        };
        ctx.cacheHandler = new CacheHandler_1.default(parentContext.cacheHandler.responseCache, ctx);
        return ctx;
    }
    static toEmittedResource(ctx) {
        const request = {
            url: ctx.url?.href,
            headers: ctx.requestHeaders,
            method: ctx.method,
            timestamp: ctx.requestTime,
        };
        const response = {
            url: ctx.responseUrl,
            statusCode: ctx.originalStatus ?? ctx.status,
            statusMessage: ctx.statusMessage,
            headers: ctx.responseHeaders,
            trailers: ctx.responseTrailers,
            timestamp: ctx.responseTime,
            browserServedFromCache: ctx.browserServedFromCache,
            browserLoadFailure: ctx.browserLoadFailure,
            browserLoadedTime: ctx.browserLoadedTime,
            remoteAddress: ctx.remoteAddress,
            bodyBytes: ctx.responseBodySize,
        };
        return {
            id: ctx.id,
            browserRequestId: ctx.browserRequestId,
            url: ctx.url,
            frameId: ctx.browserFrameId,
            request,
            response,
            postData: ctx.requestPostData,
            documentUrl: ctx.documentUrl,
            redirectedToUrl: ctx.redirectedToUrl,
            wasCached: ctx.cacheHandler?.didProposeCachedResource ?? false,
            wasIntercepted: ctx.didInterceptResource,
            resourceType: ctx.resourceType,
            body: ctx.cacheHandler?.buffer,
            localAddress: ctx.localAddress,
            dnsResolvedIp: ctx.dnsResolvedIp,
            originalHeaders: ctx.requestOriginalHeaders,
            responseOriginalHeaders: ctx.responseOriginalHeaders,
            socketId: ctx.proxyToServerMitmSocket?.id,
            protocol: ctx.protocol,
            serverAlpn: ctx.proxyToServerMitmSocket?.alpn,
            executionMillis: (ctx.responseTime ?? Date.now()) - ctx.requestTime,
            isHttp2Push: ctx.isHttp2Push,
            browserBlockedReason: ctx.browserBlockedReason,
            browserCanceled: ctx.browserCanceled,
        };
    }
    static assignMitmSocket(ctx, mitmSocket) {
        ctx.proxyToServerMitmSocket = mitmSocket;
        ctx.dnsResolvedIp = mitmSocket.dnsResolvedIp;
        ctx.isServerHttp2 = mitmSocket.isHttp2();
        ctx.localAddress = mitmSocket.localAddress;
        ctx.remoteAddress = mitmSocket.remoteAddress;
    }
    static getOriginType(url, headers) {
        if ((0, OriginType_1.isOriginType)(headers['Sec-Fetch-Site'])) {
            return headers['Sec-Fetch-Site'];
        }
        let origin = (headers.Origin ?? headers.origin);
        if (!origin) {
            const referer = (headers.Referer ?? headers.referer);
            if (referer)
                origin = new url_1.URL(referer).origin;
        }
        let originType = 'none';
        if (origin) {
            const urlOrigin = url.origin;
            if (urlOrigin === origin) {
                originType = 'same-origin';
            }
            else if (urlOrigin.includes(origin) || origin.includes(urlOrigin)) {
                originType = 'same-site';
            }
            else {
                originType = 'cross-site';
            }
        }
        return originType;
    }
    static readHttp1Response(ctx, response) {
        ctx.status = response.statusCode;
        ctx.originalStatus = response.statusCode;
        ctx.statusMessage = response.statusMessage;
        ctx.responseUrl = response.url;
        ctx.responseTime = Date.now();
        ctx.serverToProxyResponse = response;
        ctx.responseOriginalHeaders = (0, Utils_1.parseRawHeaders)(response.rawHeaders);
        ctx.responseHeaders = HeadersHandler_1.default.cleanResponseHeaders(ctx, ctx.responseOriginalHeaders);
        const redirectUrl = HeadersHandler_1.default.checkForRedirectResponseLocation(ctx);
        if (redirectUrl) {
            ctx.redirectedToUrl = redirectUrl.href;
            ctx.responseUrl = ctx.redirectedToUrl;
            ctx.requestSession.trackResourceRedirects(ctx);
        }
    }
    static readHttp2Response(ctx, response, statusCode, rawHeaders) {
        const headers = (0, Utils_1.parseRawHeaders)(rawHeaders);
        ctx.status = statusCode;
        ctx.originalStatus = statusCode;
        ctx.responseTime = Date.now();
        ctx.serverToProxyResponse = response;
        ctx.responseOriginalHeaders = headers;
        ctx.responseHeaders = HeadersHandler_1.default.cleanResponseHeaders(ctx, headers);
        const redirectUrl = HeadersHandler_1.default.checkForRedirectResponseLocation(ctx);
        if (redirectUrl) {
            ctx.redirectedToUrl = redirectUrl.href;
            ctx.responseUrl = ctx.redirectedToUrl;
            ctx.requestSession.trackResourceRedirects(ctx);
        }
    }
    static nextId() {
        this.contextIdCounter += 1;
        if (!Number.isSafeInteger(this.contextIdCounter))
            this.contextIdCounter = 1;
        return this.contextIdCounter;
    }
}
MitmRequestContext.contextIdCounter = 0;
exports.default = MitmRequestContext;
//# sourceMappingURL=MitmRequestContext.js.map