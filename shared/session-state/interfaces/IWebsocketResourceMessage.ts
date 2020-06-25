export default interface IWebsocketResourceMessage {
  resourceId: number;
  messageId: number;
  message: string | Buffer;
  source: 'server' | 'client';
}
