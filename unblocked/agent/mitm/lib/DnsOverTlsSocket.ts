import { randomBytes } from 'crypto';
import * as dnsPacket from 'dns-packet';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { createPromise } from '@ulixee/commons/lib/utils';
import MitmSocket from '@ulixee/unblocked-agent-mitm-socket/index';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IDnsSettings from '@ulixee/unblocked-specification/agent/net/IDnsSettings';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import RequestSession from '../handlers/RequestSession';
import env from "../env";

export default class DnsOverTlsSocket {
  public get host(): string {
    return this.dnsSettings.dnsOverTlsConnection?.host;
  }

  public get isActive(): boolean {
    return this.mitmSocket.isReusable() && !this.isClosing;
  }

  private readonly dnsSettings: IDnsSettings;
  private mitmSocket: MitmSocket;
  private isConnected: Promise<void>;

  private pending = new Map<
    number,
    { host: string; resolvable: IResolvablePromise<IDnsResponse> }
  >();

  private buffer: Buffer = null;
  private isClosing = false;

  private readonly onClose?: () => void;

  private requestSession: RequestSession | undefined;
  private logger: IBoundLog;
  private events = new EventSubscriber();

  constructor(dnsSettings: IDnsSettings, requestSession: RequestSession, onClose?: () => void) {
    this.requestSession = requestSession;
    this.logger = requestSession.logger.createChild(module);
    this.dnsSettings = dnsSettings;
    this.onClose = onClose;
  }

  public async lookupARecords(host: string): Promise<IDnsResponse> {
    if (!this.isConnected) {
      this.isConnected = this.connect();
    }
    await this.isConnected;
    return this.getDnsResponse(host);
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.mitmSocket?.close();
    this.events.close();
    this.requestSession = null;
    this.mitmSocket = null;
    if (this.onClose) this.onClose();
  }

  protected async connect(): Promise<void> {
    const { host, port, servername } = this.dnsSettings.dnsOverTlsConnection || {};
    this.mitmSocket = new MitmSocket(this.requestSession.sessionId, this.requestSession.logger, {
      host,
      servername,
      port: String(port ?? 853),
      isSsl: true,
      keepAlive: true,
      debug: env.isDebug,
    });

    await this.mitmSocket.connect(this.requestSession.requestAgent.socketSession, 10e3);

    this.events.on(this.mitmSocket.socket, 'data', this.onData.bind(this));

    const onCloseRegistration = this.events.on(this.mitmSocket, 'close', () => {
      this.isClosing = true;
      if (this.onClose) this.onClose();
    });
    this.events.on(this.mitmSocket, 'eof', async () => {
      this.events.off(onCloseRegistration);
      if (this.isClosing) return;
      this.mitmSocket.close();
      try {
        this.isConnected = this.connect();
        await this.isConnected;
        // re-run pending queries
        for (const [id, entry] of this.pending) {
          this.pending.delete(id);
          const newHost = this.getDnsResponse(entry.host);
          entry.resolvable.resolve(newHost);
        }
      } catch (error) {
        this.logger.info('Error re-connecting to dns', {
          error,
        });
      }
    });
  }

  private getDnsResponse(host: string): Promise<IDnsResponse> {
    const id = this.query({
      name: host,
      class: 'IN',
      type: 'A',
    });
    const resolvable = createPromise<IDnsResponse>(5e3);
    this.pending.set(id, { host, resolvable });
    return resolvable.promise;
  }

  private disconnect(): void {
    for (const [, entry] of this.pending) {
      entry.resolvable.reject(new CanceledPromiseError('Disconnecting Dns Socket'));
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
      this.pending.get(decoded.id)?.resolvable?.resolve(decoded);
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
