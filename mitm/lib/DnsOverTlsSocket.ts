import { randomBytes } from 'crypto';
import * as dnsPacket from 'dns-packet';
import { ConnectionOptions } from 'tls';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from '@secret-agent/commons/utils';
import MitmSocket from '@secret-agent/mitm-socket/index';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import RequestSession from '../handlers/RequestSession';

export default class DnsOverTlsSocket {
  public get host(): string {
    return this.dnsServer.host;
  }

  public get isActive(): boolean {
    return this.mitmSocket.isReusable() && !this.isClosing;
  }

  private dnsServer: ConnectionOptions;
  private readonly mitmSocket: MitmSocket;
  private isConnected: Promise<void>;

  private pending = new Map<number, IResolvablePromise<IDnsResponse>>();

  private buffer: Buffer = null;
  private isClosing = false;

  private readonly onClose?: () => void;

  private requestSession: RequestSession | undefined;

  constructor(dnsServer: ConnectionOptions, requestSession?: RequestSession, onClose?: () => void) {
    this.requestSession = requestSession;
    this.mitmSocket = new MitmSocket(requestSession?.sessionId, {
      host: dnsServer.host,
      port: String(dnsServer.port ?? 853),
      isSsl: true,
      servername: dnsServer.servername,
      rejectUnauthorized: false,
      clientHelloId: requestSession?.networkInterceptorDelegate?.tls.emulatorProfileId,
      keepAlive: true,
    });
    this.dnsServer = dnsServer;
    this.onClose = onClose;
  }

  public async lookupARecords(host: string): Promise<IDnsResponse> {
    const resolvable = createPromise<IDnsResponse>();
    if (!this.isConnected) this.isConnected = this.connect();
    await this.isConnected;
    const id = this.query({
      name: host,
      class: 'IN',
      type: 'A',
    });
    this.pending.set(id, resolvable);
    return resolvable.promise;
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.mitmSocket.close();
    if (this.onClose) this.onClose();
  }

  protected async connect(): Promise<void> {
    if (this.requestSession?.networkInterceptorDelegate?.dns?.useUpstreamProxy) {
      const upstreamProxy = this.requestSession.upstreamProxyUrl;
      if (upstreamProxy) {
        this.mitmSocket.setProxyUrl(upstreamProxy);
      }
    }
    await this.mitmSocket.connect(10e3);

    this.mitmSocket.socket.on('data', this.onData.bind(this));
    this.mitmSocket.on('close', () => {
      this.isClosing = true;
      if (this.onClose) this.onClose();
    });
  }

  private disconnect(): void {
    for (const [, entry] of this.pending) {
      entry.reject(new CanceledPromiseError('Disconnecting Dns Socket'));
    }
    this.close();
  }

  private query(...questions: IQuestion[]): number {
    const id = randomBytes(2).readUInt16BE(0);
    const dnsQuery = dnsPacket.streamEncode({
      flags: dnsPacket.RECURSION_DESIRED,
      id,
      questions,
      type: 'query',
    });
    this.mitmSocket.socket.write(dnsQuery);
    return id;
  }

  private onData(data: Buffer): void {
    if (this.buffer === null) {
      this.buffer = Buffer.from(data);
    } else {
      this.buffer = Buffer.concat([this.buffer, data]);
    }

    while (this.buffer.byteLength > 2) {
      const messageLength = this.getMessageLength();
      if (messageLength < 12) {
        return this.disconnect();
      }

      if (this.buffer.byteLength < messageLength + 2) return;

      // append prefixed byte length
      const next = this.buffer.slice(0, messageLength + 2);
      const decoded = dnsPacket.streamDecode(next) as IDnsResponse;
      this.pending.get(decoded.id)?.resolve(decoded);
      this.pending.delete(decoded.id);
      this.buffer = this.buffer.slice(messageLength + 2);
    }
  }

  private getMessageLength(): number | undefined {
    if (this.buffer.byteLength >= 2) {
      // https://tools.ietf.org/html/rfc7858#section-3.3
      // https://tools.ietf.org/html/rfc1035#section-4.2.2
      // The message is prefixed with a two byte length field which gives the
      // message length, excluding the two byte length field.
      return this.buffer.readUInt16BE(0);
    }
  }
}

interface IQuestion {
  name: string;
  type: string;
  class: string;
}

interface IAnswer {
  name: string;
  type: string;
  class: string;
  ttl: number;
  flush: boolean;
  data: string;
}

interface IDnsResponse {
  id: number;
  type: string;
  flags: number;
  flag_qr: boolean;
  opcode: string;
  flag_aa: boolean;
  flag_tc: boolean;
  flag_rd: boolean;
  flag_ra: boolean;
  flag_z: boolean;
  flag_ad: boolean;
  flag_cd: boolean;
  rcode: string;
  questions: IQuestion[];
  answers: IAnswer[];
  authorities: string[];
  additionals: string[];
}
