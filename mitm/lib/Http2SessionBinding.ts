import { Http2Session } from 'http2';
import { Log } from '@ulixee/commons/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { bindFunctions } from '@ulixee/commons/utils';

export default class Http2SessionBinding {
  private logger: IBoundLog;

  constructor(
    readonly clientSession: Http2Session,
    readonly serverSession: Http2Session,
    logData: { sessionId: string } & any,
  ) {
    this.logger = new Log(module, logData) as IBoundLog;
    bindFunctions(this);
    this.bind();
  }

  private bind(): void {
    const clientSession = this.clientSession;
    const serverSession = this.serverSession;

    clientSession?.on('ping', this.pingServer);

    serverSession.on('error', this.onServerError);
    serverSession.on('close', this.onServerClose);
    serverSession.on('goaway', this.onServerGoaway);

    serverSession.on('remoteSettings', remoteSettings => {
      this.logger.stats('Http2Client.remoteSettings', {
        settings: remoteSettings,
      });
    });

    serverSession.on('frameError', (frameType, errorCode) => {
      this.logger.warn('Http2Client.frameError', {
        frameType,
        errorCode,
      });
    });

    serverSession.on('altsvc', (alt, altOrigin) => {
      this.logger.stats('Http2.altsvc', {
        altOrigin,
        alt,
      });
    });

    serverSession.on('origin', origins => {
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
      opaqueData,
    });
    if (!this.clientSession || this.clientSession.destroyed) return;
    this.clientSession.goaway(code);
  }
}
