import Log from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import BaseIpcHandler from './BaseIpcHandler';

const { log } = Log(module);

export interface ICertificateStore {
  get(host: string): { key: Buffer; pem: Buffer };
  save(certificate: { key: Buffer; pem: Buffer; expireDate: number; host: string }): void;
}

let certRequestId = 0;
export default class CertificateGenerator extends BaseIpcHandler {
  protected logger: IBoundLog = log.createChild(module);

  private pendingCertsById = new Map<number, Resolvable<{ cert: string; expireDate: number }>>();
  private privateKey: Buffer;
  private waitForInit = new Resolvable<void>();
  private hasWaitForInitListeners = false;
  private store?: ICertificateStore;

  constructor(
    options: {
      debug?: boolean;
      ipcSocketPath?: string;
      storageDir?: string;
      store?: ICertificateStore;
    } = {},
  ) {
    super({ ...options, mode: 'certs' });
    this.store = options.store;
  }

  public async getCertificate(host: string): Promise<{ cert: Buffer; key: Buffer }> {
    if (this.isClosing) return { key: null, cert: null };
    await this.waitForConnected;
    const existing = this.store?.get(host);
    if (existing) {
      return { cert: existing.pem, key: existing.key };
    }
    // if it doesn't exist, generate now
    const { expireDate, cert, key } = await this.generateCerts(host);
    this.store?.save({ host, pem: cert, expireDate, key });
    return { key, cert };
  }

  public override close(): void {
    super.close();
    for (const pending of this.pendingCertsById.values())
      pending.reject(new CanceledPromiseError('Closing Certificate Generator'), true);
  }

  protected async generateCerts(
    host: string,
  ): Promise<{ cert: Buffer; expireDate: number; key: Buffer }> {
    await this.waitForConnected;
    certRequestId += 1;
    const id = certRequestId;

    const resolvable = new Resolvable<{ cert: string; expireDate: number }>(10e3);
    this.pendingCertsById.set(id, resolvable);

    try {
      await this.waitForInit;
      await this.sendIpcMessage({ id, host });
    } catch (error) {
      if (this.isClosing) return;
      throw error;
    }

    this.hasWaitForInitListeners = true;
    const { cert, expireDate } = await resolvable.promise;
    return { cert: Buffer.from(cert), expireDate, key: this.privateKey };
  }

  protected onMessage(rawMessage: string): void {
    if (this.isClosing) return;
    const message = JSON.parse(rawMessage);
    if (this.options.debug) {
      const toLog = { ...message };
      if (message.status === 'init') {
        toLog.privateKey = `-----BEGIN RSA PRIVATE KEY-----\n...key used by man-in-the-middle removed for logs...\n-----END RSA PRIVATE KEY-----\n`;
      }
      this.logger.info('CertificateGenerator.onMessage', {
        ...toLog,
      });
    }

    if (message.status === 'init') {
      this.privateKey = Buffer.from(message.privateKey);
      this.waitForInit.resolve();
      return;
    }

    if (!message.id) {
      this.logger.warn('CertificateGenerator.unprocessableMessage', {
        message,
      });
      return;
    }

    const pending = this.pendingCertsById.get(message.id);
    if (!pending) {
      this.logger.warn('CertificateGenerator.unprocessableMessage:notFound', {
        message,
      });
      return;
    }

    this.pendingCertsById.delete(message.id);

    if (message.status === 'error') {
      pending.reject(new Error(message.error));
    } else if (message.status === 'certs') {
      pending.resolve({ cert: message.cert, expireDate: message.expireDate * 1e3 });
    }
  }

  protected beforeExit(): void {
    for (const cert of this.pendingCertsById.values()) {
      cert.reject(new CanceledPromiseError('Canceling certificate generation'), true);
    }
    if (this.hasWaitForInitListeners && this.waitForInit && !this.waitForInit.isResolved) {
      this.waitForInit.reject(new CanceledPromiseError('Canceling ipc initialization'), true);
    }
  }
}
