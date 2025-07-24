import { RequestOptions } from 'http';
import IHttpSocketAgent from '@ulixee/unblocked-specification/agent/net/IHttpSocketAgent';
import * as http2 from 'http2';
export default function lookupPublicIp(ipLookupServiceUrl?: string, agent?: IHttpSocketAgent, proxyUrl?: string): Promise<string>;
export declare function httpGet(requestUrl: string, requestOptions: RequestOptions): Promise<string>;
export declare function http2Get(path: string, h2Client: http2.ClientHttp2Session): Promise<string>;
export declare const IpLookupServices: {
    ipify: string;
    icanhazip: string;
    aws: string;
    identMe: string;
    ifconfigMe: string;
    ipecho: string;
    ipinfo: string;
    opendns: string;
};
