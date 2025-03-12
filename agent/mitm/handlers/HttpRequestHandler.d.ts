import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import HttpResponseCache from '../lib/HttpResponseCache';
import BaseHttpHandler from './BaseHttpHandler';
export default class HttpRequestHandler extends BaseHttpHandler {
    protected static responseCache: HttpResponseCache;
    constructor(request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse'>);
    onRequest(): Promise<void>;
    protected onResponse(response: IMitmRequestContext['serverToProxyResponse'], flags?: number, rawHeaders?: string[]): Promise<void>;
    protected onError(kind: string, error: Error): void;
    private bindErrorListeners;
    private writeRequest;
    private writeResponseHead;
    private writeResponse;
    private safeWriteToClient;
    private isClientConnectionDestroyed;
    static onRequest(request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse'>): Promise<void>;
}
