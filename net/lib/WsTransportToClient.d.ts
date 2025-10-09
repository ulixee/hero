import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IncomingMessage } from 'http';
import WebSocket = require('ws');
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
export default class WsTransportToClient extends TypedEventEmitter<ITransportEvents> implements ITransport {
    private webSocket;
    private request;
    remoteId: string;
    isConnected: boolean;
    private events;
    private readonly keepAlive;
    private lastActivity;
    constructor(webSocket: WebSocket, request: IncomingMessage);
    send(payload: any): Promise<void>;
    disconnect(fatalError?: Error): void;
    private checkAlive;
    private onPong;
    private onDisconnect;
    private onMessage;
}
