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
    constructor(webSocket: WebSocket, request: IncomingMessage);
    send(payload: any): Promise<void>;
    private onClose;
    private onError;
    private onMessage;
}
