export default interface IHttpSocketConnectOptions {
  host: string;
  port: string;
  isSsl: boolean;
  keepAlive?: boolean;
  debug?: boolean;
  servername?: string;
  isWebsocket?: boolean;
  keylogPath?: string;
  proxyUrl?: string;
}
