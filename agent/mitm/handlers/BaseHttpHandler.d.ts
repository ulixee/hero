import * as http from 'http';
import * as http2 from 'http2';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import HttpResponseCache from '../lib/HttpResponseCache';
export default abstract class BaseHttpHandler {
    readonly context: IMitmRequestContext;
    protected abstract onError(kind: string, error: Error): any;
    protected constructor(request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse'>, isUpgrade: boolean, responseCache: HttpResponseCache);
    protected createProxyToServerRequest(): Promise<http.ClientRequest | http2.ClientHttp2Stream>;
    protected cleanup(): void;
    protected bindHttp2ErrorListeners(source: string, stream: http2.Http2Stream, session: http2.Http2Session): void;
}
