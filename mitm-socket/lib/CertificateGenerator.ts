import Log from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import BaseIpcHandler from './BaseIpcHandler';

const { log } = Log(module);

let certRequestId = 0;
export default class CertificateGenerator extends BaseIpcHandler {
  protected logger: IBoundLog = log.createChild(module);

  private pendingCertsById = new Map<number, Resolvable<{ cert: string; expireDate: number }>>();

  private privateKey: string;
  private waitForInit = new Resolvable<void>();
  private hasWaitForInitListeners = false;

  constructor(
    options: Partial<{
      debug?: boolean;
      ipcSocketPath?: string;
      storageDir?: string;
    }> = {},
  ) {
    super({ ...options, mode: 'certs' });
  }

  public async getPrivateKey(): Promise<string> {
    await this.waitForInit;
    return this.privateKey;
  }

  public async generateCerts(host: string): Promise<{ cert: string; expireDate: number }> {
    await this.waitForConnected;
    certRequestId += 1;
    const id = certRequestId;

    const resolvable = new Resolvable<{ cert: string; expireDate: number }>(10e3);
    this.pendingCertsById.set(id, resolvable);

    try {
      await this.sendIpcMessage({ id, host });
    } catch (error) {
      if (this.isClosing) return;
      throw error;
    }

    this.hasWaitForInitListeners = true;
    await this.waitForInit;
    return await resolvable.promise;
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
      this.privateKey = message.privateKey;
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
      cert.reject(new CanceledPromiseError('Canceling certificate generation'));
    }
    if (this.hasWaitForInitListeners && this.waitForInit && !this.waitForInit.isResolved) {
      this.waitForInit.reject(new CanceledPromiseError('Canceling ipc initialization'));
    }
  }
}
