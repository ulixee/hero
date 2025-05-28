import IDnsSettings from '@ulixee/unblocked-specification/agent/net/IDnsSettings';
import RequestSession from '../handlers/RequestSession';
export default class DnsOverTlsSocket {
    get host(): string;
    get isActive(): boolean;
    private readonly dnsSettings;
    private mitmSocket;
    private isConnected;
    private pending;
    private buffer;
    private isClosing;
    private readonly onClose?;
    private requestSession;
    private logger;
    private events;
    constructor(dnsSettings: IDnsSettings, requestSession: RequestSession, onClose?: () => void);
    lookupARecords(host: string): Promise<IDnsResponse>;
    close(): void;
    protected connect(): Promise<void>;
    private getDnsResponse;
    private disconnect;
    private query;
    private onData;
    private getMessageLength;
}
interface IQuestion {
    name: string;
    type: string;
    class: string;
}
interface IAnswer {
    name: string;
    type: string;
    class: string;
    ttl: number;
    flush: boolean;
    data: string;
}
interface IDnsResponse {
    id: number;
    type: string;
    flags: number;
    flag_qr: boolean;
    opcode: string;
    flag_aa: boolean;
    flag_tc: boolean;
    flag_rd: boolean;
    flag_ra: boolean;
    flag_z: boolean;
    flag_ad: boolean;
    flag_cd: boolean;
    rcode: string;
    questions: IQuestion[];
    answers: IAnswer[];
    authorities: string[];
    additionals: string[];
}
export {};
