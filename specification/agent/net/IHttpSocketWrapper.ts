import * as net from 'net';

export default interface IHttpSocketWrapper {
  id: number;
  alpn: string;
  socket: net.Socket;
  dnsResolvedIp: string;
  remoteAddress: string;
  localAddress: string;
  serverName: string;

  createTime: Date;
  dnsLookupTime: Date;
  connectTime: Date;
  errorTime: Date;
  closeTime: Date;

  isConnected: boolean;
  isClosing: boolean;

  isHttp2(): boolean;
  close(): void;
}
