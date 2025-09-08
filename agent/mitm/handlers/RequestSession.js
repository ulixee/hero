"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const url_1 = require("url");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const MitmRequestAgent_1 = require("../lib/MitmRequestAgent");
const Dns_1 = require("../lib/Dns");
const ResourceState_1 = require("../interfaces/ResourceState");
class RequestSession extends eventUtils_1.TypedEventEmitter {
    constructor(sessionId, hooks, logger, upstreamProxyUrl, upstreamProxyUseSystemDns) {
        super();
        this.sessionId = sessionId;
        this.upstreamProxyUrl = upstreamProxyUrl;
        this.upstreamProxyUseSystemDns = upstreamProxyUseSystemDns;
        this.websocketBrowserResourceIds = {};
        this.isClosing = false;
        this.interceptorHandlers = [];
        this.redirectsByRedirectedUrl = {};
        this.respondWithHttpErrorStacks = true;
        this.hooks = [];
        this.events = new EventSubscriber_1.default();
        this.logger = logger.createChild(module);
        if (hooks)
            this.hook(hooks);
        this.requestAgent = new MitmRequestAgent_1.default(this);
        this.dns = new Dns_1.Dns(this);
    }
    hook(hooks) {
        this.hooks.push(hooks);
    }
    lookupSourceRedirect(resource) {
        const url = resource.url.href;
        const redirect = this.redirectsByRedirectedUrl[url]?.find(x => resource.requestTime - x.responseTime < 5e3);
        resource.isFromRedirect = !!redirect;
        if (redirect) {
            const redirectChain = [redirect.url, ...redirect.redirectChain];
            resource.previousUrl = redirectChain[0];
            resource.firstRedirectingUrl = redirectChain[redirectChain.length - 1];
        }
    }
    trackResourceRedirects(resource) {
        if (!resource.redirectedToUrl)
            return;
        const resourceRedirect = {
            url: resource.url.href,
            responseTime: resource.responseTime,
            redirectChain: [],
        };
        this.redirectsByRedirectedUrl[resource.redirectedToUrl] ??= [];
        this.redirectsByRedirectedUrl[resource.redirectedToUrl].push(resourceRedirect);
        const redirect = this.redirectsByRedirectedUrl[resourceRedirect.url]?.find(x => resource.requestTime - x.responseTime < 5e3);
        if (redirect) {
            resourceRedirect.redirectChain = [redirect.url, ...redirect.redirectChain];
        }
    }
    // NOTE: must change names from plugin callbacks or it will loop back here
    async willSendHttpRequestBody(context) {
        for (const hook of this.hooks) {
            await hook.beforeHttpRequestBody?.(context);
        }
    }
    async willSendHttpResponse(context) {
        context.setState(ResourceState_1.default.EmulationWillSendResponse);
        if (context.resourceType === 'Document' && context.status === 200) {
            for (const hook of this.hooks) {
                await hook.websiteHasFirstPartyInteraction?.(context.url);
            }
        }
        for (const hook of this.hooks) {
            await hook.beforeHttpResponse?.(context);
        }
    }
    async willSendHttpResponseBody(context) {
        for (const hook of this.hooks) {
            await hook.beforeHttpResponseBody?.(context);
        }
    }
    async didSendHttpResponse(context) {
        for (const hook of this.hooks) {
            await hook.afterHttpResponse?.(context);
        }
    }
    async lookupDns(host) {
        if (this.dns && !this.isClosing) {
            try {
                return await this.dns.lookupIp(host);
            }
            catch (error) {
                this.logger.info('DnsLookup.Error', {
                    error,
                });
                // if fails, pass through to returning host untouched
            }
        }
        return Promise.resolve(host);
    }
    getProxyCredentials() {
        return `ulixee:${this.sessionId}`;
    }
    close() {
        if (this.isClosing)
            return;
        const logid = this.logger.stats('MitmRequestSession.Closing');
        this.isClosing = true;
        const errors = [];
        this.events.close();
        this.browserRequestMatcher?.cancelPending();
        this.browserRequestMatcher = null;
        try {
            this.requestAgent.close();
        }
        catch (err) {
            errors.push(err);
        }
        try {
            this.dns.close();
        }
        catch (err) {
            errors.push(err);
        }
        this.logger.stats('MitmRequestSession.Closed', { parentLogId: logid, errors });
        setImmediate(() => {
            this.emit('close');
            this.removeAllListeners();
        });
    }
    shouldInterceptRequest(url, resourceType) {
        for (const handler of this.interceptorHandlers) {
            if (handler.types && resourceType) {
                if (handler.types.includes(resourceType))
                    return true;
            }
            if (!handler.urls)
                continue;
            if (!handler.hasParsed) {
                handler.urls = handler.urls.map(x => {
                    if (typeof x === 'string')
                        return stringToRegex(x);
                    return x;
                });
                handler.hasParsed = true;
            }
            for (const blockedUrlFragment of handler.urls) {
                if (url.match(blockedUrlFragment)) {
                    return true;
                }
            }
        }
        for (const hook of this.hooks) {
            if (hook.shouldBlockRequest?.(url, resourceType))
                return true;
        }
        return false;
    }
    async didHandleInterceptResponse(ctx, request, response) {
        const url = ctx.url.href;
        for (const handler of this.interceptorHandlers) {
            const isMatch = handler.types?.includes(ctx.resourceType) || handler.urls?.some(x => url.match(x));
            if (isMatch &&
                handler.handlerFn &&
                (await handler.handlerFn(ctx.url, ctx.resourceType, request, response))) {
                return true;
            }
        }
        return false;
    }
    /////// / BROWSER HOOKS ///////////////////////////////////////////////////////////////////////////////////////////////
    onNewPage(page) {
        this.events.on(page, 'websocket-handshake', this.registerWebsocketHeaders.bind(this));
        this.events.on(page, 'navigation-response', this.recordDocumentUserActivity.bind(this));
        return Promise.resolve();
    }
    recordDocumentUserActivity(event) {
        for (const hook of this.hooks) {
            void hook.websiteHasFirstPartyInteraction?.(new url_1.URL(event.url));
        }
    }
    /////// Websockets ///////////////////////////////////////////////////////////
    getWebsocketUpgradeRequestId(headers) {
        const key = this.getWebsocketHeadersKey(headers);
        this.websocketBrowserResourceIds[key] ??= (0, utils_1.createPromise)(30e3);
        return this.websocketBrowserResourceIds[key].promise;
    }
    registerWebsocketHeaders(message) {
        const key = this.getWebsocketHeadersKey(message.headers);
        this.websocketBrowserResourceIds[key] ??= (0, utils_1.createPromise)();
        this.websocketBrowserResourceIds[key].resolve(message.browserRequestId);
    }
    getWebsocketHeadersKey(headers) {
        let websocketKey;
        let host;
        for (const key of Object.keys(headers)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'sec-websocket-key')
                websocketKey = headers[key];
            if (lowerKey === 'host')
                host = headers[key];
        }
        return [host, websocketKey].join(',');
    }
    static sendNeedsAuth(socket) {
        socket.end('HTTP/1.1 407 Proxy Authentication Required\r\n' +
            'Proxy-Authenticate: Basic realm="agent"\r\n\r\n');
    }
}
exports.default = RequestSession;
function stringToRegex(str) {
    if (str.startsWith('*'))
        str = `.*${str.slice(1)}`;
    const escaped = str.replace(/\/\*/g, '.*').replace(/[-[/\]{}()+?.,\\^$|#\s]/g, '\\$&');
    return new RegExp(escaped);
}
//# sourceMappingURL=RequestSession.js.map