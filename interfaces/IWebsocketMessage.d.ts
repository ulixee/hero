export default interface IWebsocketMessage {
    resourceId: number;
    messageId: number;
    timestamp: number;
    message: string | Buffer;
    source: 'server' | 'client';
}
