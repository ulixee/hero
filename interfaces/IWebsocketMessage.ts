export default interface IWebsocketMessage {
  message: string | Buffer;
  source: 'server' | 'client';
}
