import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
export default class HttpTransportToCore extends TypedEventEmitter<ITransportEvents> implements ITransport {
    readonly host: string;
    isConnected: boolean;
    isDisconnecting: boolean;
    private pendingRequestsToPromise;
    private httpAgent;
    private httpsAgent;
    constructor(host: string);
    send(payload: any): Promise<void>;
    disconnect(): Promise<void>;
    connect(): Promise<void>;
    private request;
}
