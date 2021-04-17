import Log from '@secret-agent/commons/Logger';
import Resolvable from '@secret-agent/commons/Resolvable';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import BaseIpcHandler from './BaseIpcHandler';

const { log } = Log(module);

let certRequestId = 0;
export default class CertificateGenerator extends BaseIpcHandler {
  protected logger: IBoundLog = log.createChild(module);

  private pendingCertsById = new Map<number, Resolvable<{ cert: string; expireDate: Date }>>();

  private privateKey: string;
  private waitForInit = new Resolvable<void>();
  private hasWaitForInitListeners = false;

  constructor(
    options: Partial<{
      debug?: boolean;
      ipcSocketPath?: string;
    }> = {},
  ) {
    super({ ...options, mode: 'certs' });
  }

  public async getPrivateKey(): Promise<string> {
    await this.waitForInit;
    return this.privateKey;
  }

  public async generateCerts(host: string): Promise<{ cert: string; expireDate: Date }> {
    await this.waitForConnected;
    certRequestId += 1;
    const id = certRequestId;
    await this.sendIpcMessage({ id, host });
    const resolvable = new Resolvable<{ cert: string; expireDate: Date }>(10e3);
    this.pendingCertsById.set(id, resolvable);

    this.hasWaitForInitListeners = true;
    await this.waitForInit;
    return await resolvable.promise;
  }

  protected onMessage(rawMessage: string): void {
    if (this.isClosing) return;
    const message = JSON.parse(rawMessage);
    if (this.options.debug) {
      this.logger.info('CertificateGenerator.onMessage', {
        ...message,
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
    this.pendingCertsById.delete(message.id);

    if (message.status === 'error') {
      pending.reject(new Error(message.error));
    } else if (message.status === 'certs') {
      pending.resolve({ cert: message.cert, expireDate: new Date(message.expireDate * 1e3) });
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
