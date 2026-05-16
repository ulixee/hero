import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
export default abstract class BaseIpcHandler {
    isClosing: boolean;
    get waitForConnected(): Promise<void>;
    get pid(): number | undefined;
    protected abstract logger: IBoundLog;
    protected options: IGoIpcOpts;
    private hasWaitListeners;
    private waitForConnect;
    private child;
    private readonly ipcServer;
    private ipcSocket;
    private isExited;
    private pendingMessage;
    private readonly handlerName;
    protected constructor(options: Partial<IGoIpcOpts>);
    close(): void;
    protected abstract onMessage(message: string): void;
    protected abstract beforeExit(): void;
    protected sendIpcMessage(message: any): Promise<void>;
    private onIpcConnection;
    private onExit;
    private onError;
    private onIpcData;
    private onChildProcessMessage;
    private onChildProcessStderr;
    private spawnChild;
    private getDefaultOptions;
}
export interface IGoIpcOpts {
    mode?: 'certs' | 'proxy';
    storageDir?: string;
    userAgent?: string;
    ipcSocketPath?: string;
    clientHelloId?: string;
    tcpTtl?: number;
    tcpWindowSize?: number;
    rejectUnauthorized?: boolean;
    debug?: boolean;
    debugData?: boolean;
}
