import CertificateGenerator, { ICertificateStore } from '@ulixee/unblocked-agent-mitm-socket/lib/CertificateGenerator';
import IMitmProxyOptions from '../interfaces/IMitmProxyOptions';
import RequestSession from '../handlers/RequestSession';
import ICertificateGenerator from '../interfaces/ICertificateGenerator';
/**
 * This module is heavily inspired by 'https://github.com/joeferner/node-http-mitm-proxy'
 */
export default class MitmProxy {
    get port(): number;
    get httpPort(): number | undefined;
    get http2Port(): number | undefined;
    get httpsPort(): number | undefined;
    private http2Sessions;
    private isolatedProxyForSessionId?;
    private sessionById;
    private sessionIdByPort;
    private portsBySessionId;
    private readonly options;
    private readonly httpServer;
    private readonly httpsServer;
    private readonly http2Server;
    private readonly serverConnects;
    private readonly events;
    private isClosing;
    private readonly certificateGenerator;
    private secureContexts;
    constructor(options: IMitmProxyOptions);
    close(): void;
    registerSession(session: RequestSession, isDefault: boolean): void;
    removeSessionTracking(sessionId: string): void;
    protected listen(): Promise<this>;
    private onHttpRequest;
    private onHttpUpgrade;
    private onHttpConnect;
    private onHttp2Session;
    private isHttp2;
    private onGenericHttpError;
    private tryCloseConnectSocket;
    private onClientError;
    private onConnectError;
    private addSecureContext;
    private readSessionId;
    private registerProxySession;
    static createCertificateGenerator(store?: ICertificateStore, sslCaDir?: string): CertificateGenerator;
    static start(certificateGenerator: ICertificateGenerator): Promise<MitmProxy>;
    private static isTlsByte;
}
