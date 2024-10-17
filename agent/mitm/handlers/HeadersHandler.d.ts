import IHttpHeaders from '@ulixee/unblocked-specification/agent/net/IHttpHeaders';
import { URL } from 'url';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
export default class HeadersHandler {
    static determineResourceType(ctx: IMitmRequestContext): Promise<void>;
    static getRequestHeader<T = string | string[]>(ctx: Pick<IHttpResourceLoadDetails, 'requestHeaders'>, name: string): T;
    static isWorkerDest(ctx: Pick<IHttpResourceLoadDetails, 'requestHeaders'>, ...types: ('shared' | 'service' | 'worker')[]): boolean;
    static cleanResponseHeaders(ctx: IMitmRequestContext, originalRawHeaders: IHttpHeaders): IHttpHeaders;
    static checkForRedirectResponseLocation(context: IMitmRequestContext): URL;
    static sendRequestTrailers(ctx: IMitmRequestContext): void;
    static prepareRequestHeadersForHttp2(ctx: IMitmRequestContext): void;
    static cleanPushHeaders(ctx: IMitmRequestContext): void;
    static cleanProxyHeaders(ctx: IMitmRequestContext): void;
}
