export default interface IWebsocketResourceMessage {
  timestamp: number;
  resourceId: number;
  messageId: number;
  message: string | Buffer;
  source: 'server' | 'client';
}
