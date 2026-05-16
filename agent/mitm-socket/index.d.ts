import * as net from 'net';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IHttpSocketWrapper from '@ulixee/unblocked-specification/agent/net/IHttpSocketWrapper';
import IHttpSocketConnectOptions from '@ulixee/unblocked-specification/agent/net/IHttpSocketConnectOptions';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import MitmSocketSession from './lib/MitmSocketSession';
export default class MitmSocket extends TypedEventEmitter<{
    connect: void;
    dial: void;
    eof: void;
    close: void;
}> implements IHttpSocketWrapper {
    readonly sessionId: string;
    readonly connectOpts: IHttpSocketConnectOptions;
    get isWebsocket(): boolean;
    readonly socketPath: string;
    alpn: string;
    rawApplicationSettings: Buffer;
    alps: {
        settings?: {
            id: number;
            value: number;
        }[];
        acceptCh?: {
            domain: string;
            headers: string[];
        };
    };
    socket: net.Socket;
    dnsResolvedIp: string;
    remoteAddress: string;
    localAddress: string;
    serverName: string;
    id: number;
    createTime: Date;
    dnsLookupTime: Date;
    ipcConnectionTime: Date;
    connectTime: Date;
    errorTime: Date;
    closeTime: Date;
    isConnected: boolean;
    isReused: boolean;
    isClosing: boolean;
    closedPromise: Resolvable<Date>;
    connectError?: string;
    receivedEOF: boolean;
    protected logger: IBoundLog;
    private server;
    private connectPromise;
    private socketReadyPromise;
    private events;
    private readonly callStack;
    constructor(sessionId: string, logger: IBoundLog, connectOpts: IHttpSocketConnectOptions);
    isReusable(): boolean;
    setProxyUrl(url: string): void;
    isHttp2(): boolean;
    close(): void;
    onConnected(socket: net.Socket): void;
    connect(session: MitmSocketSession, connectTimeoutMillis?: number): Promise<void>;
    onMessage(message: any): void;
    onExit(): void;
    private triggerConnectErrorIfNeeded;
    private onError;
    private cleanupSocket;
}
