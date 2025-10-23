import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import BaseIpcHandler from './BaseIpcHandler';
export interface ICertificateStore {
    get(host: string): {
        key: Buffer;
        pem: Buffer;
    };
    save(certificate: {
        key: Buffer;
        pem: Buffer;
        expireDate: number;
        host: string;
    }): void;
}
export default class CertificateGenerator extends BaseIpcHandler {
    protected logger: IBoundLog;
    private pendingCertsById;
    private privateKey;
    private waitForInit;
    private hasWaitForInitListeners;
    private store?;
    constructor(options?: {
        debug?: boolean;
        ipcSocketPath?: string;
        storageDir?: string;
        store?: ICertificateStore;
    });
    getCertificate(host: string): Promise<{
        cert: Buffer;
        key: Buffer;
    }>;
    close(): void;
    protected generateCerts(host: string): Promise<{
        cert: Buffer;
        expireDate: number;
        key: Buffer;
    }>;
    protected onMessage(rawMessage: string): void;
    protected beforeExit(): void;
}
