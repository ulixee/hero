"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const InterceptorHandler_1 = require("./InterceptorHandler");
const HeadersHandler_1 = require("./HeadersHandler");
const MitmRequestContext_1 = require("../lib/MitmRequestContext");
const ResourceState_1 = require("../interfaces/ResourceState");
const { log } = (0, Logger_1.default)(module);
class BaseHttpHandler {
    constructor(request, isUpgrade, responseCache) {
        this.context = MitmRequestContext_1.default.create({ ...request, isUpgrade }, responseCache);
    }
    async createProxyToServerRequest() {
        const context = this.context;
        const session = context.requestSession;
        try {
            // track request
            session.lookupSourceRedirect(this.context);
            session.emit('request', MitmRequestContext_1.default.toEmittedResource(this.context));
            if (session.isClosing)
                return context.setState(ResourceState_1.default.SessionClosed);
            // need to determine resource type before blocking
            await HeadersHandler_1.default.determineResourceType(context);
            if (await InterceptorHandler_1.default.shouldIntercept(context)) {
                context.setState(ResourceState_1.default.Intercepted);
                log.info(`Http.RequestBlocked`, {
                    sessionId: session.sessionId,
                    url: context.url.href,
                });
                await context.browserHasRequested;
                session.emit('response', MitmRequestContext_1.default.toEmittedResource(this.context));
                // already wrote reply
                return null;
            }
            // do one more check on the session before doing a connect
            if (session.isClosing)
                return context.setState(ResourceState_1.default.SessionClosed);
            const request = await session.requestAgent.request(context);
            this.context.proxyToServerRequest = request;
            this.context.events.on(request, 'error', this.onError.bind(this, 'ProxyToServer.RequestError'));
            if (this.context.isServerHttp2) {
                const h2Request = request;
                this.bindHttp2ErrorListeners('ProxyToH2Server', h2Request, h2Request.session);
            }
            return this.context.proxyToServerRequest;
        }
        catch (err) {
            this.onError('ProxyToServer.RequestHandlerError', err);
        }
    }
    cleanup() {
        this.context.events.close('error');
        this.context.proxyToServerRequest = null;
        this.context.clientToProxyRequest = null;
        this.context.requestSession = null;
        this.context.proxyToClientResponse = null;
        this.context.proxyToServerMitmSocket = null;
        this.context.cacheHandler = null;
        this.context.browserHasRequested = null;
    }
    bindHttp2ErrorListeners(source, stream, session) {
        const events = this.context.events;
        if (!stream.listenerCount('error')) {
            events.on(stream, 'error', this.onError.bind(this, `${source}.Http2StreamError`));
        }
        events.on(stream, 'streamClosed', code => {
            if (!code)
                return;
            this.onError(`${source}.Http2StreamError`, new Error(`Stream Closed ${code}`));
        });
        if (session && !session.listenerCount('error')) {
            events.on(session, 'error', this.onError.bind(this, `${source}.Http2SessionError`));
        }
    }
}
exports.default = BaseHttpHandler;
//# sourceMappingURL=BaseHttpHandler.js.map