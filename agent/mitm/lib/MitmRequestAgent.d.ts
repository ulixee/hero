import MitmSocket from '@ulixee/unblocked-agent-mitm-socket';
import * as http2 from 'http2';
import * as http from 'http';
import MitmSocketSession from '@ulixee/unblocked-agent-mitm-socket/lib/MitmSocketSession';
import IHttpSocketConnectOptions from '@ulixee/unblocked-specification/agent/net/IHttpSocketConnectOptions';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import RequestSession from '../handlers/RequestSession';
export default class MitmRequestAgent {
    static defaultMaxConnectionsPerOrigin: number;
    socketSession: MitmSocketSession;
    private session;
    private readonly maxConnectionsPerOrigin;
    private readonly events;
    private readonly socketPoolByOrigin;
    private readonly socketPoolByResolvedHost;
    private logger;
    constructor(session: RequestSession);
    request(ctx: IMitmRequestContext): Promise<http2.ClientHttp2Stream | http.ClientRequest>;
    freeSocket(ctx: IMitmRequestContext): void;
    close(): void;
    isHostAlpnH2(hostname: string, port: string): Promise<boolean>;
    createSocketConnection(options: IHttpSocketConnectOptions, timeoutMillis?: number): Promise<MitmSocket>;
    private assignSocket;
    private getSocketPoolByOrigin;
    private http1Request;
    private http2Request;
    private createHttp2Session;
}
