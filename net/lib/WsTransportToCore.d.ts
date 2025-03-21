import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
export default class WsTransportToCore extends TypedEventEmitter<ITransportEvents> implements ITransport {
    host: string;
    get isConnected(): boolean;
    isDisconnecting: boolean;
    private connectPromise;
    private webSocket;
    private events;
    private readonly hostPromise;
    constructor(host: string | Promise<string>);
    send(payload: any): Promise<void>;
    disconnect(): void;
    connect(timeoutMs?: number): Promise<void>;
    private onMessage;
    private setHost;
}
