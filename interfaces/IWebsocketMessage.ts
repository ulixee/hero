export default interface IWebsocketMessage {
  timestamp: number;
  message: string | Buffer;
  source: 'server' | 'client';
}
