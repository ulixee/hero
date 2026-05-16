"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const http = require("http");
const http2_1 = require("http2");
const ResourceState_1 = require("../interfaces/ResourceState");
const HttpResponseCache_1 = require("../lib/HttpResponseCache");
const MitmRequestContext_1 = require("../lib/MitmRequestContext");
const Utils_1 = require("../lib/Utils");
const BaseHttpHandler_1 = require("./BaseHttpHandler");
const HeadersHandler_1 = require("./HeadersHandler");
const { log } = (0, Logger_1.default)(module);
class HttpRequestHandler extends BaseHttpHandler_1.default {
    constructor(request) {
        super(request, false, HttpRequestHandler.responseCache);
        this.context.setState(ResourceState_1.default.ClientToProxyRequest);
        // register error listeners first
        this.bindErrorListeners();
    }
    async onRequest() {
        const { clientToProxyRequest } = this.context;
        try {
            clientToProxyRequest.pause();
            const proxyToServerRequest = await this.createProxyToServerRequest();
            if (!proxyToServerRequest) {
                clientToProxyRequest.resume();
                this.cleanup();
                return;
            }
            const responsePromise = new Promise(resolve => this.context.events.once(proxyToServerRequest, 'response', (r, flags, headers) => resolve([r, flags, headers])));
            clientToProxyRequest.resume();
            const socketClosedPromise = this.context.proxyToServerMitmSocket.closedPromise.promise;
            // now write request - make sure socket doesn't exit before writing
            const didWriteRequest = await Promise.race([this.writeRequest(), socketClosedPromise]);
            if (didWriteRequest instanceof Date) {
                throw new Error('Socket closed before request written');
            }
            // wait for response and make sure socket doesn't exit before writing
            const response = await Promise.race([responsePromise, socketClosedPromise]);
            if (response instanceof Date) {
                throw new Error('Socket closed before response received');
            }
            await this.onResponse(...response);
        }
        catch (err) {
            this.onError('ClientToProxy.HandlerError', err);
        }
    }
    async onResponse(response, flags, rawHeaders) {
        const context = this.context;
        context.setState(ResourceState_1.default.ServerToProxyOnResponse);
        if (response instanceof http.IncomingMessage) {
            MitmRequestContext_1.default.readHttp1Response(context, response);
        }
        else {
            MitmRequestContext_1.default.readHttp2Response(context, context.proxyToServerRequest, response[':status'], rawHeaders);
        }
        // wait for MitmRequestContext to read this
        context.events.on(context.serverToProxyResponse, 'error', this.onError.bind(this, 'ServerToProxy.ResponseError'));
        try {
            context.cacheHandler.onResponseHeaders();
        }
        catch (err) {
            return this.onError('ServerToProxy.ResponseHeadersHandlerError', err);
        }
        /////// WRITE CLIENT RESPONSE //////////////////
        if (!context.proxyToClientResponse) {
            log.warn('Error.NoProxyToClientResponse', {
                sessionId: context.requestSession.sessionId,
            });
            context.setState(ResourceState_1.default.PrematurelyClosed);
            return;
        }
        await context.requestSession.willSendHttpResponse(context);
        try {
            this.writeResponseHead();
        }
        catch (err) {
            return this.onError('ServerToProxyToClient.WriteResponseHeadError', err);
        }
        try {
            await this.writeResponse();
        }
        catch (err) {
            return this.onError('ServerToProxyToClient.ReadWriteResponseError', err);
        }
        await context.requestSession.didSendHttpResponse(context);
        context.setState(ResourceState_1.default.End);
        this.cleanup();
    }
    onError(kind, error) {
        const isCanceled = error instanceof IPendingWaitEvent_1.CanceledPromiseError;
        const url = this.context.url.href;
        const { method, requestSession, proxyToClientResponse } = this.context;
        // already cleaned up
        if (requestSession === null || proxyToClientResponse === null)
            return;
        const sessionId = requestSession.sessionId;
        this.context.setState(ResourceState_1.default.Error);
        requestSession.emit('http-error', {
            request: MitmRequestContext_1.default.toEmittedResource(this.context),
            error,
        });
        let status = 504;
        if (isCanceled) {
            status = 444;
        }
        if (!isCanceled && !requestSession.isClosing && !error[Logger_1.hasBeenLoggedSymbol]) {
            log.info(`MitmHttpRequest.${kind}`, {
                sessionId,
                request: `${method}: ${url}`,
                error,
            });
        }
        try {
            if (!proxyToClientResponse.headersSent) {
                proxyToClientResponse.sendDate = false;
                proxyToClientResponse.writeHead(status);
                const errorText = this.context.requestSession.respondWithHttpErrorStacks ? error.stack : '';
                proxyToClientResponse.end(errorText);
            }
            else if (!proxyToClientResponse.finished) {
                proxyToClientResponse.end();
            }
        }
        catch (e) {
            // drown errors
        }
        this.cleanup();
    }
    bindErrorListeners() {
        const { clientToProxyRequest, proxyToClientResponse, events } = this.context;
        events.on(clientToProxyRequest, 'error', this.onError.bind(this, 'ClientToProxy.RequestError'));
        events.on(proxyToClientResponse, 'error', this.onError.bind(this, 'ProxyToClient.ResponseError'));
        if (clientToProxyRequest instanceof http2_1.Http2ServerRequest) {
            const stream = clientToProxyRequest.stream;
            this.bindHttp2ErrorListeners('ClientToProxy', stream, stream.session);
        }
        if (proxyToClientResponse instanceof http2_1.Http2ServerResponse) {
            const stream = proxyToClientResponse.stream;
            this.bindHttp2ErrorListeners('ProxyToClient', stream, stream.session);
        }
    }
    async writeRequest() {
        this.context.setState(ResourceState_1.default.WriteProxyToServerRequestBody);
        const { proxyToServerRequest, clientToProxyRequest } = this.context;
        const onWriteError = (error) => {
            if (error) {
                this.onError('ProxyToServer.WriteError', error);
            }
        };
        this.context.requestPostDataStream = clientToProxyRequest;
        await this.context.requestSession.willSendHttpRequestBody(this.context);
        const data = [];
        for await (const chunk of this.context.requestPostDataStream) {
            data.push(chunk);
            proxyToServerRequest.write(chunk, onWriteError);
        }
        delete this.context.requestPostDataStream;
        HeadersHandler_1.default.sendRequestTrailers(this.context);
        await new Promise(resolve => proxyToServerRequest.end(resolve));
        this.context.requestPostData = Buffer.concat(data);
    }
    writeResponseHead() {
        const context = this.context;
        const { serverToProxyResponse, proxyToClientResponse, requestSession, events } = context;
        // NOTE: nodejs won't allow an invalid status, but chrome will.
        // TODO: we should find a way to keep this status
        if (context.status > 599) {
            log.info(`MitmHttpRequest.modifyStatusResponseCode`, {
                sessionId: requestSession.sessionId,
                request: `${context.method}: ${context.url.href}`,
                actualStatus: context.status,
                responseStatus: 599,
            });
            context.status = 599;
        }
        proxyToClientResponse.statusCode = context.status;
        // write individually so we properly write header-lists
        for (const [key, value] of Object.entries(context.responseHeaders)) {
            try {
                proxyToClientResponse.setHeader(key, value);
            }
            catch (error) {
                log.info(`MitmHttpRequest.writeResponseHeadError`, {
                    sessionId: requestSession.sessionId,
                    request: `${context.method}: ${context.url.href}`,
                    error,
                    header: [key, value],
                });
            }
        }
        events.once(serverToProxyResponse, 'trailers', headers => {
            context.responseTrailers = headers;
        });
        proxyToClientResponse.writeHead(proxyToClientResponse.statusCode);
    }
    async writeResponse() {
        const context = this.context;
        const { serverToProxyResponse, proxyToClientResponse } = context;
        context.setState(ResourceState_1.default.WriteProxyToClientResponseBody);
        context.responseBodySize = 0;
        context.responseBodyStream = serverToProxyResponse;
        await this.context.requestSession.willSendHttpResponseBody(this.context);
        for await (const chunk of context.responseBodyStream) {
            const buffer = chunk;
            context.responseBodySize += buffer.length;
            const data = context.cacheHandler.onResponseData(buffer);
            this.safeWriteToClient(data);
        }
        delete this.context.responseBodyStream;
        if (context.cacheHandler.shouldServeCachedData) {
            this.safeWriteToClient(context.cacheHandler.cacheData);
        }
        if (serverToProxyResponse instanceof http.IncomingMessage) {
            context.responseTrailers = (0, Utils_1.parseRawHeaders)(serverToProxyResponse.rawTrailers);
        }
        if (context.responseTrailers) {
            proxyToClientResponse.addTrailers(context.responseTrailers);
        }
        await new Promise(resolve => proxyToClientResponse.end(resolve));
        context.requestSession.requestAgent.freeSocket(context);
        context.cacheHandler.onResponseEnd();
        // wait for browser request id before resolving
        await context.browserHasRequested;
        context.requestSession.emit('response', MitmRequestContext_1.default.toEmittedResource(context));
    }
    safeWriteToClient(data) {
        if (!data || this.isClientConnectionDestroyed())
            return;
        this.context.proxyToClientResponse.write(data, error => {
            if (error && !this.isClientConnectionDestroyed())
                this.onError('ServerToProxy.WriteResponseError', error);
        });
    }
    isClientConnectionDestroyed() {
        const proxyToClientResponse = this.context.proxyToClientResponse;
        if (!proxyToClientResponse)
            return true;
        return (proxyToClientResponse.stream?.destroyed ||
            proxyToClientResponse.socket?.destroyed ||
            proxyToClientResponse.connection?.destroyed);
    }
    static async onRequest(request) {
        const handler = new HttpRequestHandler(request);
        await handler.onRequest();
    }
}
HttpRequestHandler.responseCache = new HttpResponseCache_1.default();
exports.default = HttpRequestHandler;
//# sourceMappingURL=HttpRequestHandler.js.map