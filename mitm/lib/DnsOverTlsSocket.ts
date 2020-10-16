import { randomBytes } from 'crypto';
import * as dnsPacket from 'dns-packet';
import { ConnectionOptions } from 'tls';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import MitmSocket from '@secret-agent/mitm-socket/index';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import RequestSession from '../handlers/RequestSession';

export default class DnsOverTlsSocket {
  public get host() {
    return this.dnsServer.host;
  }

  public get isActive() {
    return this.mitmSocket.isReusable() && !this.isClosing;
  }

  private dnsServer: ConnectionOptions;
  private readonly mitmSocket: MitmSocket;
  private readonly isConnected: Promise<void>;

  private pending = new Map<number, IResolvablePromise<IDnsResponse>>();

  private currentMessage: Buffer = null;
  private packetLength = 0;
  private isClosing = false;

  private readonly onClose?: () => void;

  private requestSession: RequestSession;

  constructor(dnsServer: ConnectionOptions, requestSession?: RequestSession, onClose?: () => void) {
    this.requestSession = requestSession;
    this.mitmSocket = new MitmSocket(requestSession?.sessionId, {
      host: dnsServer.host,
      port: String(dnsServer.port ?? 853),
      isSsl: true,
      servername: dnsServer.servername,
      rejectUnauthorized: false,
      clientHelloId: requestSession?.delegate?.tlsProfileId,
      keepAlive: true,
    });
    this.dnsServer = dnsServer;
    this.onClose = onClose;
    this.isConnected = this.connect();
  }

  public async lookupARecords(host: string): Promise<IDnsResponse> {
    const resolvable = createPromise<IDnsResponse>();
    await this.isConnected;
    const id = this.query({
      name: host,
      class: 'IN',
      type: 'A',
    });
    this.pending.set(id, resolvable);
    return resolvable.promise;
  }

  public close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.mitmSocket.close();
    if (this.onClose) this.onClose();
  }

  protected async connect() {
    const proxyUrl = await this.requestSession?.getUpstreamProxyUrl();
    if (proxyUrl) this.mitmSocket.setProxy(proxyUrl);

    await this.mitmSocket.connect();

    this.mitmSocket.socket.on('data', this.onData.bind(this));
    this.mitmSocket.on('close', () => {
      this.isClosing = true;
      if (this.onClose) this.onClose();
    });
  }

  private disconnect() {
    for (const [, entry] of this.pending) {
      entry.reject(new CanceledPromiseError('Disconnecting Dns Socket'));
    }
    this.close();
  }

  private query(...questions: IQuestion[]) {
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

  private onData(data: Buffer) {
    if (this.currentMessage === null) {
      this.currentMessage = Buffer.from(data);
    } else {
      this.currentMessage = Buffer.concat([this.currentMessage, data]);
    }

    if (this.currentMessage.byteLength >= 2 && !this.packetLength) {
      // https://tools.ietf.org/html/rfc7858#section-3.3
      // https://tools.ietf.org/html/rfc1035#section-4.2.2
      // The message is prefixed with a two byte length field which gives the
      // message length, excluding the two byte length field.
      this.packetLength = this.currentMessage.readUInt16BE(0);
      if (this.packetLength < 12) {
        return this.disconnect();
      }
    }

    // append prefixed byte length
    if (this.currentMessage.byteLength === this.packetLength + 2) {
      const decoded = dnsPacket.streamDecode(this.currentMessage) as IDnsResponse;
      this.pending.get(decoded.id)?.resolve(decoded);
      this.pending.delete(decoded.id);
      this.currentMessage = null;
      this.packetLength = 0;
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
