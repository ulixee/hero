import { Http2Session } from 'http2';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { IEventSubscriber } from '@ulixee/commons/interfaces/IRegisteredEventListener';

export default class Http2SessionBinding {
  private logger: IBoundLog;

  constructor(
    readonly clientSession: Http2Session,
    readonly serverSession: Http2Session,
    readonly events: IEventSubscriber,
    logger: IBoundLog,
    logData: any,
  ) {
    this.logger = logger.createChild(module, logData);
    bindFunctions(this);
    this.bind();
  }

  private bind(): void {
    const clientSession = this.clientSession;
    const serverSession = this.serverSession;

    if (clientSession) this.events.on(clientSession, 'ping', this.pingServer);

    this.events.on(serverSession, 'error', this.onServerError);
    this.events.on(serverSession, 'close', this.onServerClose);
    this.events.on(serverSession, 'goaway', this.onServerGoaway);

    this.events.on(serverSession, 'remoteSettings', remoteSettings => {
      this.logger.stats('Http2Client.remoteSettings', {
        remoteSettings,
      });
    });

    this.events.on(serverSession, 'frameError', (frameType, errorCode) => {
      this.logger.warn('Http2Client.frameError', {
        frameType,
        errorCode,
      });
    });

    this.events.on(serverSession, 'altsvc', (alt, altOrigin) => {
      this.logger.stats('Http2.altsvc', {
        altOrigin,
        alt,
      });
    });

    this.events.on(serverSession, 'origin', origins => {
      this.logger.stats('Http2.origin', {
        origins,
      });
    });
  }

  private pingServer(bytes: Buffer): void {
    if (this.serverSession.destroyed) return;
    this.serverSession.ping(bytes, () => null);
  }

  private onServerClose(): void {
    this.logger.info('Http2Client.close');
    if (!this.clientSession || this.clientSession.destroyed) return;
    this.clientSession.close();
  }

  private onServerError(error: Error): void {
    this.logger.warn('Http2Client.error', {
      error,
    });
    if (!this.clientSession || this.clientSession.destroyed) return;
    this.clientSession.destroy(error);
  }

  private onServerGoaway(
    code: number,
    lastStreamID?: number,
    opaqueData?: NodeJS.ArrayBufferView,
  ): void {
    this.logger.stats('Http2.goaway', {
      code,
      lastStreamID,
      opaqueData: opaqueData ? Buffer.from(opaqueData.buffer).toString() : undefined,
    });
    if (!this.clientSession || this.clientSession.destroyed) return;
    this.clientSession.goaway(code);
  }
}
