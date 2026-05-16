import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import DnsOverTlsSocket from './DnsOverTlsSocket';
import RequestSession from '../handlers/RequestSession';
export declare class Dns {
    private requestSession?;
    static dnsEntries: Map<string, IResolvablePromise<IDnsEntry>>;
    socket: DnsOverTlsSocket;
    private readonly dnsSettings;
    constructor(requestSession?: RequestSession);
    lookupIp(host: string, retries?: number): Promise<string>;
    close(): void;
    private systemLookup;
    private doSystemLookup;
    private lookupDnsEntry;
    private doLookupDnsOverTls;
    private nextIp;
    private getNextCachedARecord;
}
interface IDnsEntry {
    aRecords: {
        ip: string;
        expiry: Date;
    }[];
}
export {};
