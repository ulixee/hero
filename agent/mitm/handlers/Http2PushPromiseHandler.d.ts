import * as http2 from 'http2';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
export default class Http2PushPromiseHandler {
    readonly parentContext: IMitmRequestContext;
    readonly requestHeaders: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader;
    private readonly context;
    private onResponseHeadersPromise;
    private logger;
    private get session();
    constructor(parentContext: IMitmRequestContext, serverPushStream: http2.ClientHttp2Stream, requestHeaders: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader, flags: number, rawHeaders: string[]);
    onRequest(): Promise<void>;
    private onClientPushPromiseCreated;
    private cleanupEventListeners;
    private onHttp2PushError;
}
