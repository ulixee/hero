import * as http from 'http';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IResourceRequest from '@ulixee/unblocked-specification/agent/net/IResourceRequest';
import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
import * as http2 from 'http2';
import IResourceResponse from '@ulixee/unblocked-specification/agent/net/IResourceResponse';
import * as net from 'net';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import MitmSocket from '@ulixee/unblocked-agent-mitm-socket/index';
import { URL } from 'url';
import { IBrowserContextHooks, INetworkHooks } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import MitmRequestAgent from '../lib/MitmRequestAgent';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';
import IBrowserRequestMatcher from '../interfaces/IBrowserRequestMatcher';
export default class RequestSession extends TypedEventEmitter<IRequestSessionEvents> implements IBrowserContextHooks {
    readonly sessionId: string;
    upstreamProxyUrl?: string;
    upstreamProxyUseSystemDns?: boolean;
    websocketBrowserResourceIds: {
        [headersHash: string]: IResolvablePromise<string>;
    };
    isClosing: boolean;
    interceptorHandlers: {
        types?: IResourceType[];
        urls?: (string | RegExp)[];
        handlerFn?: INetworkHooks['handleInterceptedRequest'];
        hasParsed?: boolean;
    }[];
    requestAgent: MitmRequestAgent;
    redirectsByRedirectedUrl: {
        [requestedUrl: string]: {
            url: string;
            redirectChain: string[];
            responseTime: number;
        }[];
    };
    respondWithHttpErrorStacks: boolean;
    bypassAllWithEmptyResponse: boolean;
    bypassResourceRegistrationForHost: URL;
    browserRequestMatcher?: IBrowserRequestMatcher;
    logger: IBoundLog;
    readonly hooks: INetworkHooks[];
    private readonly dns;
    private events;
    constructor(sessionId: string, hooks: INetworkHooks, logger: IBoundLog, upstreamProxyUrl?: string, upstreamProxyUseSystemDns?: boolean);
    hook(hooks: INetworkHooks): void;
    lookupSourceRedirect(resource: IHttpResourceLoadDetails): void;
    trackResourceRedirects(resource: IHttpResourceLoadDetails): void;
    willSendHttpRequestBody(context: IMitmRequestContext): Promise<void>;
    willSendHttpResponse(context: IMitmRequestContext): Promise<void>;
    willSendHttpResponseBody(context: IMitmRequestContext): Promise<void>;
    didSendHttpResponse(context: IMitmRequestContext): Promise<void>;
    lookupDns(host: string): Promise<string>;
    getProxyCredentials(): string;
    close(): void;
    willInterceptRequest(url: URL, resourceType?: IResourceType): Promise<boolean>;
    didHandleInterceptResponse(ctx: IMitmRequestContext, request: http.IncomingMessage | http2.Http2ServerRequest, response: http.ServerResponse | http2.Http2ServerResponse): Promise<boolean>;
    onNewPage(page: IPage): Promise<void>;
    recordDocumentUserActivity(event: {
        url: string;
    }): void;
    getWebsocketUpgradeRequestId(headers: IHttpHeaders): Promise<string>;
    registerWebsocketHeaders(message: {
        browserRequestId: string;
        headers: IHttpHeaders;
    }): void;
    private getWebsocketHeadersKey;
    static sendNeedsAuth(socket: net.Socket): void;
}
interface IRequestSessionEvents {
    close: void;
    response: IRequestSessionResponseEvent;
    request: IRequestSessionRequestEvent;
    'http-error': IRequestSessionHttpErrorEvent;
    'resource-state': IResourceStateChangeEvent;
    'socket-connect': ISocketEvent;
    'socket-close': ISocketEvent;
}
export interface ISocketEvent {
    socket: MitmSocket;
}
export interface IResourceStateChangeEvent {
    context: IMitmRequestContext;
    state: ResourceState;
}
export interface IRequestSessionResponseEvent extends IRequestSessionRequestEvent {
    browserRequestId: string;
    frameId: number;
    response: IResourceResponse;
    wasCached: boolean;
    dnsResolvedIp?: string;
    resourceType: IResourceType;
    responseOriginalHeaders?: IHttpHeaders;
    body: Buffer;
    redirectedToUrl?: string;
    executionMillis: number;
    browserBlockedReason?: string;
    browserCanceled?: boolean;
}
export interface IRequestSessionRequestEvent {
    id: number;
    url: URL;
    request: IResourceRequest;
    postData: Buffer;
    documentUrl: string;
    serverAlpn: string;
    protocol: string;
    socketId: number;
    isHttp2Push: boolean;
    wasIntercepted: boolean;
    originalHeaders: IHttpHeaders;
    localAddress: string;
}
export interface IRequestSessionHttpErrorEvent {
    request: IRequestSessionResponseEvent;
    error: Error;
}
export {};
