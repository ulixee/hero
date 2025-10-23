"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http2 = require("http2");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const MitmRequestContext_1 = require("../lib/MitmRequestContext");
const InterceptorHandler_1 = require("./InterceptorHandler");
const HeadersHandler_1 = require("./HeadersHandler");
const ResourceState_1 = require("../interfaces/ResourceState");
const { log } = (0, Logger_1.default)(module);
class Http2PushPromiseHandler {
    get session() {
        return this.context.requestSession;
    }
    constructor(parentContext, serverPushStream, requestHeaders, flags, rawHeaders) {
        this.parentContext = parentContext;
        this.requestHeaders = requestHeaders;
        const session = parentContext.requestSession;
        const sessionId = session.sessionId;
        this.logger = session.logger.createChild(module);
        log.info('Http2Client.pushReceived', { sessionId, requestHeaders, flags });
        this.logger.info('Http2Client.pushReceived', { requestHeaders, flags });
        this.context = MitmRequestContext_1.default.createFromHttp2Push(parentContext, rawHeaders);
        this.context.events.on(serverPushStream, 'error', error => {
            this.logger.warn('Http2.ProxyToServer.PushStreamError', {
                error,
            });
        });
        this.context.serverToProxyResponse = serverPushStream;
        this.session.lookupSourceRedirect(this.context);
        this.context.setState(ResourceState_1.default.ServerToProxyPush);
        this.session.emit('request', MitmRequestContext_1.default.toEmittedResource(this.context));
    }
    async onRequest() {
        const pushContext = this.context;
        const parentContext = this.parentContext;
        const session = this.session;
        const serverPushStream = this.context.serverToProxyResponse;
        if (await InterceptorHandler_1.default.shouldIntercept(pushContext)) {
            await pushContext.browserHasRequested;
            session.emit('response', MitmRequestContext_1.default.toEmittedResource(pushContext));
            pushContext.setState(ResourceState_1.default.Intercepted);
            return serverPushStream.close(http2.constants.NGHTTP2_CANCEL);
        }
        HeadersHandler_1.default.cleanPushHeaders(pushContext);
        this.onResponseHeadersPromise = new Promise(resolve => {
            const events = this.context.events;
            events.once(serverPushStream, 'push', (responseHeaders, responseFlags, rawHeaders) => {
                MitmRequestContext_1.default.readHttp2Response(pushContext, serverPushStream, responseHeaders[':status'], rawHeaders);
                resolve();
            });
        });
        if (serverPushStream.destroyed) {
            pushContext.setState(ResourceState_1.default.PrematurelyClosed);
            return;
        }
        const clientToProxyRequest = parentContext.clientToProxyRequest;
        pushContext.setState(ResourceState_1.default.ProxyToClientPush);
        try {
            clientToProxyRequest.stream.pushStream(pushContext.requestHeaders, this.onClientPushPromiseCreated.bind(this));
        }
        catch (error) {
            this.logger.warn('Http2.ClientToProxy.CreatePushStreamError', {
                error,
            });
        }
    }
    async onClientPushPromiseCreated(createPushStreamError, proxyToClientPushStream) {
        this.context.setState(ResourceState_1.default.ProxyToClientPushResponse);
        const serverToProxyPushStream = this.context.serverToProxyResponse;
        const cache = this.context.cacheHandler;
        const session = this.context.requestSession;
        const events = this.context.events;
        if (createPushStreamError) {
            this.logger.warn('Http2.ClientToProxy.PushStreamError', {
                error: createPushStreamError,
            });
            return;
        }
        events.on(proxyToClientPushStream, 'error', pushError => {
            this.logger.warn('Http2.ClientToProxy.PushStreamError', {
                error: pushError,
            });
        });
        events.on(serverToProxyPushStream, 'headers', additional => {
            if (!proxyToClientPushStream.destroyed)
                proxyToClientPushStream.additionalHeaders(additional);
        });
        let trailers;
        events.once(serverToProxyPushStream, 'trailers', trailerHeaders => {
            trailers = trailerHeaders;
        });
        await this.onResponseHeadersPromise;
        if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed) {
            return;
        }
        cache.onHttp2PushStream();
        try {
            if (cache.shouldServeCachedData) {
                if (!proxyToClientPushStream.destroyed) {
                    proxyToClientPushStream.write(cache.cacheData, err => {
                        if (err)
                            this.onHttp2PushError('Http2PushProxyToClient.CacheWriteError', err);
                    });
                }
                if (!serverToProxyPushStream.destroyed) {
                    serverToProxyPushStream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
                }
            }
            else {
                proxyToClientPushStream.respond(this.context.responseHeaders, { waitForTrailers: true });
                events.on(proxyToClientPushStream, 'wantTrailers', () => {
                    this.context.responseTrailers = trailers;
                    if (trailers)
                        proxyToClientPushStream.sendTrailers(this.context.responseTrailers ?? {});
                    else
                        proxyToClientPushStream.close();
                });
                this.context.setState(ResourceState_1.default.ServerToProxyPushResponse);
                for await (const chunk of serverToProxyPushStream) {
                    if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed)
                        return;
                    cache.onResponseData(chunk);
                    proxyToClientPushStream.write(chunk, err => {
                        if (err)
                            this.onHttp2PushError('Http2PushProxyToClient.WriteError', err);
                    });
                }
                if (!serverToProxyPushStream.destroyed)
                    serverToProxyPushStream.end();
            }
            if (!proxyToClientPushStream.destroyed)
                proxyToClientPushStream.end();
            cache.onResponseEnd();
            await HeadersHandler_1.default.determineResourceType(this.context);
            await this.context.browserHasRequested;
            session.emit('response', MitmRequestContext_1.default.toEmittedResource(this.context));
        }
        catch (writeError) {
            this.onHttp2PushError('Http2PushProxyToClient.UnhandledError', writeError);
            if (!proxyToClientPushStream.destroyed)
                proxyToClientPushStream.destroy();
        }
        finally {
            this.cleanupEventListeners();
        }
    }
    cleanupEventListeners() {
        this.context.events.close('error');
    }
    onHttp2PushError(kind, error) {
        const isCanceled = error instanceof IPendingWaitEvent_1.CanceledPromiseError;
        this.context.setState(ResourceState_1.default.Error);
        this.session?.emit('http-error', {
            request: MitmRequestContext_1.default.toEmittedResource(this.context),
            error,
        });
        if (!isCanceled && !this.session?.isClosing && !error[Logger_1.hasBeenLoggedSymbol]) {
            this.logger.info(`MitmHttpRequest.${kind}`, {
                request: `H2PUSH: ${this.context.url.href}`,
                error,
            });
        }
        this.cleanupEventListeners();
    }
}
exports.default = Http2PushPromiseHandler;
//# sourceMappingURL=Http2PushPromiseHandler.js.map