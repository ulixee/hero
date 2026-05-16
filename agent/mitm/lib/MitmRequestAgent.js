"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_mitm_socket_1 = require("@ulixee/unblocked-agent-mitm-socket");
const http2 = require("http2");
const https = require("https");
const http = require("http");
const MitmSocketSession_1 = require("@ulixee/unblocked-agent-mitm-socket/lib/MitmSocketSession");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const MitmRequestContext_1 = require("./MitmRequestContext");
const HeadersHandler_1 = require("../handlers/HeadersHandler");
const ResourceState_1 = require("../interfaces/ResourceState");
const SocketPool_1 = require("./SocketPool");
const Http2PushPromiseHandler_1 = require("../handlers/Http2PushPromiseHandler");
const Http2SessionBinding_1 = require("./Http2SessionBinding");
const env_1 = require("../env");
class MitmRequestAgent {
    constructor(session) {
        this.events = new EventSubscriber_1.default();
        this.socketPoolByOrigin = new Map();
        this.socketPoolByResolvedHost = new Map();
        this.session = session;
        this.logger = session.logger.createChild(module);
        const tcpSettings = {};
        const tlsSettings = {};
        for (const hook of session.hooks)
            hook.onTcpConfiguration?.(tcpSettings);
        for (const hook of session.hooks)
            hook.onTlsConfiguration?.(tlsSettings);
        this.socketSession = new MitmSocketSession_1.default(session.logger, {
            rejectUnauthorized: env_1.default.allowInsecure === false,
            clientHelloId: tlsSettings?.tlsClientHelloId,
            tcpTtl: tcpSettings?.tcpTtl,
            tcpWindowSize: tcpSettings?.tcpWindowSize,
            debug: env_1.default.isDebug,
            userAgent: tlsSettings.proxyUseragent,
        });
        this.maxConnectionsPerOrigin =
            tlsSettings?.socketsPerOrigin ?? MitmRequestAgent.defaultMaxConnectionsPerOrigin;
    }
    async request(ctx) {
        const url = ctx.url;
        const requestSettings = {
            method: ctx.method,
            path: url.pathname + url.search,
            host: url.hostname,
            port: url.port || (ctx.isSSL ? 443 : 80),
            headers: ctx.requestHeaders,
            rejectUnauthorized: env_1.default.allowInsecure === false,
            // @ts-ignore
            insecureHTTPParser: true, // if we don't include this setting, invalid characters in http requests will blow up responses
        };
        await this.assignSocket(ctx, requestSettings);
        ctx.cacheHandler.onRequest();
        ctx.setState(ResourceState_1.default.BeforeSendRequest);
        if (ctx.isServerHttp2) {
            // NOTE: must come after connect to know if http2
            for (const hook of ctx.requestSession.hooks) {
                await hook.beforeHttpRequest?.(ctx);
            }
            HeadersHandler_1.default.prepareRequestHeadersForHttp2(ctx);
            return this.http2Request(ctx);
        }
        if (!ctx.requestHeaders.host && !ctx.requestHeaders.Host) {
            ctx.requestHeaders.Host = ctx.url.host;
        }
        HeadersHandler_1.default.cleanProxyHeaders(ctx);
        for (const hook of ctx.requestSession.hooks) {
            await hook.beforeHttpRequest?.(ctx);
        }
        requestSettings.headers = ctx.requestHeaders;
        return this.http1Request(ctx, requestSettings);
    }
    freeSocket(ctx) {
        if (ctx.isUpgrade || ctx.isServerHttp2 || this.session.isClosing) {
            return;
        }
        const headers = ctx.responseOriginalHeaders;
        let isCloseRequested = false;
        if (headers) {
            if (headers.Connection === 'close' || headers.connection === 'close') {
                isCloseRequested = true;
            }
        }
        const socket = ctx.proxyToServerMitmSocket;
        if (!socket.isReusable() || isCloseRequested) {
            return socket.close();
        }
        socket.isReused = true;
        const pool = this.getSocketPoolByOrigin(ctx.url.origin);
        pool?.freeSocket(ctx.proxyToServerMitmSocket);
    }
    close() {
        if (!this.socketSession)
            return;
        try {
            this.socketSession.close();
            this.socketSession = null;
        }
        catch (err) {
            // don't need to log closing sessions
        }
        for (const pool of this.socketPoolByOrigin.values()) {
            pool.close();
        }
        this.socketPoolByOrigin.clear();
        this.socketPoolByResolvedHost.clear();
        this.events.close('error');
        this.session = null;
    }
    async isHostAlpnH2(hostname, port) {
        const pool = this.getSocketPoolByOrigin(`${hostname}:${port}`);
        const options = { host: hostname, port, isSsl: true, keepAlive: true, servername: hostname };
        return await pool.isHttp2(false, this.createSocketConnection.bind(this, options));
    }
    async createSocketConnection(options, timeoutMillis = 10e3) {
        const session = this.session;
        const dnsLookupTime = new Date();
        const ipIfNeeded = await session.lookupDns(options.host);
        const mitmSocket = new unblocked_agent_mitm_socket_1.default(session.sessionId, session.logger, {
            host: ipIfNeeded || options.host,
            port: String(options.port),
            isSsl: options.isSsl,
            servername: options.servername || options.host,
            keepAlive: options.keepAlive,
            isWebsocket: options.isWebsocket,
            keylogPath: env_1.default.sslKeylogFile,
            debug: options.debug ?? env_1.default.isDebug,
        });
        mitmSocket.dnsResolvedIp = ipIfNeeded;
        mitmSocket.dnsLookupTime = dnsLookupTime;
        this.events.on(mitmSocket, 'connect', () => session.emit('socket-connect', { socket: mitmSocket }));
        if (session.upstreamProxyUrl) {
            mitmSocket.setProxyUrl(session.upstreamProxyUrl);
        }
        await mitmSocket.connect(this.socketSession, timeoutMillis);
        if (options.isWebsocket) {
            mitmSocket.socket.setNoDelay(true);
            mitmSocket.socket.setTimeout(0);
        }
        return mitmSocket;
    }
    async assignSocket(ctx, options) {
        ctx.setState(ResourceState_1.default.GetSocket);
        const pool = this.getSocketPoolByOrigin(ctx.url.origin);
        options.isSsl = ctx.isSSL;
        options.keepAlive = !(options.headers.connection ?? options.headers.Connection)?.match(/close/i);
        options.isWebsocket = ctx.isUpgrade;
        const mitmSocket = await pool.getSocket(options.isWebsocket, this.createSocketConnection.bind(this, options, ctx.connectTimeoutMillis));
        MitmRequestContext_1.default.assignMitmSocket(ctx, mitmSocket);
        return mitmSocket;
    }
    getSocketPoolByOrigin(origin) {
        let lookup = origin.split('://').pop();
        if (!lookup.includes(':') && origin.includes('://')) {
            const isSecure = origin.startsWith('wss://') || origin.startsWith('https://');
            if (isSecure)
                lookup += ':443';
            else
                lookup += ':80';
        }
        if (!this.socketPoolByOrigin.has(lookup)) {
            this.socketPoolByOrigin.set(lookup, new SocketPool_1.default(lookup, this.maxConnectionsPerOrigin, this.session));
        }
        return this.socketPoolByOrigin.get(lookup);
    }
    async http1Request(ctx, requestSettings) {
        const httpModule = ctx.isSSL ? https : http;
        ctx.setState(ResourceState_1.default.CreateProxyToServerRequest);
        let didHaveFlushErrors = false;
        ctx.proxyToServerMitmSocket.receivedEOF = false;
        const request = httpModule.request({
            ...requestSettings,
            createConnection: () => ctx.proxyToServerMitmSocket.socket,
            agent: null,
        });
        this.events.on(request, 'error', error => {
            this.logger.info(`MitmHttpRequest.Http1SendRequestError`, {
                request: requestSettings,
                error,
            });
        });
        const flushListener = this.events.once(request, 'error', error => {
            if (error.code === 'ECONNRESET') {
                didHaveFlushErrors = true;
            }
        });
        let responseCallbackArgs;
        let upgradeCallbackArgs;
        request.once('response', (...args) => {
            responseCallbackArgs = args;
        });
        request.once('upgrade', (...args) => {
            upgradeCallbackArgs = args;
        });
        // we have to rebroadcast because this function is async, so the handlers can register late
        const rebroadcastMissedEvent = (event, handler) => {
            if (event === 'response' && responseCallbackArgs) {
                handler(...responseCallbackArgs);
                responseCallbackArgs = null;
            }
            if (event === 'upgrade' && upgradeCallbackArgs) {
                handler(...upgradeCallbackArgs);
                upgradeCallbackArgs = null;
            }
            // hand off to another fn
            if (event === 'error')
                this.events.off(flushListener);
            return request;
        };
        const originalOn = request.on.bind(request);
        const originalOnce = request.once.bind(request);
        request.on = function onOverride(event, handler) {
            originalOn(event, handler);
            return rebroadcastMissedEvent(event, handler);
        };
        request.once = function onOverride(event, handler) {
            originalOnce(event, handler);
            return rebroadcastMissedEvent(event, handler);
        };
        // if re-using, we need to make sure the connection can still be written to by probing it
        if (ctx.proxyToServerMitmSocket.isReused) {
            if (!request.headersSent)
                request.flushHeaders();
            // give this 100 ms to flush (go is on a wait timer right now)
            await new Promise(resolve => setTimeout(resolve, 100));
            if (didHaveFlushErrors ||
                ctx.proxyToServerMitmSocket.isClosing ||
                ctx.proxyToServerMitmSocket.receivedEOF) {
                const socket = ctx.proxyToServerMitmSocket;
                socket.close();
                await this.assignSocket(ctx, requestSettings);
                return this.http1Request(ctx, requestSettings);
            }
        }
        return request;
    }
    /////// ////////// Http2 helpers //////////////////////////////////////////////////////////////////
    async http2Request(ctx) {
        const client = await this.createHttp2Session(ctx);
        ctx.setState(ResourceState_1.default.CreateProxyToServerRequest);
        const weight = ctx.clientToProxyRequest.stream?.state?.weight;
        return client.request(ctx.requestHeaders, { waitForTrailers: true, weight, exclusive: true });
    }
    async createHttp2Session(ctx) {
        const origin = ctx.url.origin;
        let originSocketPool;
        let resolvedHost;
        if (ctx.dnsResolvedIp) {
            const port = ctx.url.port || (ctx.isSSL ? 443 : 80);
            resolvedHost = `${ctx.dnsResolvedIp}:${port}`;
            originSocketPool = this.socketPoolByResolvedHost.get(resolvedHost);
        }
        originSocketPool ??= this.getSocketPoolByOrigin(origin);
        if (resolvedHost && !this.socketPoolByResolvedHost.has(resolvedHost)) {
            this.socketPoolByResolvedHost.set(resolvedHost, originSocketPool);
        }
        const existing = originSocketPool.getHttp2Session();
        if (existing)
            return existing.client;
        const clientToProxyH2Session = ctx.clientToProxyRequest.stream?.session;
        ctx.setState(ResourceState_1.default.CreateH2Session);
        const settings = {
            settings: clientToProxyH2Session?.remoteSettings,
            localWindowSize: clientToProxyH2Session?.state.localWindowSize,
        };
        for (const hook of ctx.requestSession.hooks) {
            await hook.onHttp2SessionConnect?.(ctx, settings);
        }
        const connectPromise = new Resolvable_1.default();
        const proxyToServerH2Client = http2.connect(origin, {
            settings: settings.settings,
            createConnection: () => ctx.proxyToServerMitmSocket.socket,
        }, async (remoteSession) => {
            if ('setLocalWindowSize' in remoteSession && settings.localWindowSize) {
                // @ts-ignore
                remoteSession.setLocalWindowSize(settings.localWindowSize);
                await new Promise(setImmediate);
            }
            connectPromise.resolve();
        });
        const binding = new Http2SessionBinding_1.default(clientToProxyH2Session, proxyToServerH2Client, this.events, this.session.logger, {
            origin,
        });
        this.events.on(proxyToServerH2Client, 'stream', async (stream, headers, flags, rawHeaders) => {
            try {
                const pushPromise = new Http2PushPromiseHandler_1.default(ctx, stream, headers, flags, rawHeaders);
                await pushPromise.onRequest();
            }
            catch (error) {
                this.logger.warn('Http2.ClientToProxy.ReadPushPromiseError', {
                    rawHeaders,
                    error,
                });
            }
        });
        this.events.on(proxyToServerH2Client, 'origin', origins => {
            for (const svcOrigin of origins) {
                this.getSocketPoolByOrigin(svcOrigin).registerHttp2Session(proxyToServerH2Client, ctx.proxyToServerMitmSocket, binding);
            }
        });
        originSocketPool.registerHttp2Session(proxyToServerH2Client, ctx.proxyToServerMitmSocket, binding);
        await connectPromise;
        return proxyToServerH2Client;
    }
}
MitmRequestAgent.defaultMaxConnectionsPerOrigin = 6;
exports.default = MitmRequestAgent;
//# sourceMappingURL=MitmRequestAgent.js.map