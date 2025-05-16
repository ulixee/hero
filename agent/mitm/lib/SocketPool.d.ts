import MitmSocket from '@ulixee/unblocked-agent-mitm-socket';
import { ClientHttp2Session } from 'http2';
import RequestSession from '../handlers/RequestSession';
import Http2SessionBinding from './Http2SessionBinding';
export default class SocketPool {
    readonly maxConnections: any;
    readonly session: RequestSession;
    alpn: string;
    isClosing: boolean;
    private readonly events;
    private all;
    private pooled;
    private free;
    private pending;
    private readonly http2Sessions;
    private queue;
    private logger;
    constructor(origin: string, maxConnections: any, session: RequestSession);
    freeSocket(socket: MitmSocket): void;
    isHttp2(isWebsocket: boolean, createSocket: () => Promise<MitmSocket>): Promise<boolean>;
    getSocket(isWebsocket: boolean, createSocket: () => Promise<MitmSocket>): Promise<MitmSocket>;
    close(): void;
    getHttp2Session(): IHttp2Session | undefined;
    registerHttp2Session(client: ClientHttp2Session, mitmSocket: MitmSocket, binding: Http2SessionBinding): void;
    private onSocketClosed;
    private closeHttp2Session;
}
interface IHttp2Session {
    client: ClientHttp2Session;
    mitmSocket: MitmSocket;
    binding: Http2SessionBinding;
}
export {};
