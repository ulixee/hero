import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import '@ulixee/commons/lib/SourceMapSupport';
import { IncomingMessage, ServerResponse } from 'http';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
export default class HttpTransportToClient extends TypedEventEmitter<ITransportEvents> implements ITransport {
    request: IncomingMessage;
    private response;
    private static requestCounter;
    remoteId: string;
    isConnected: boolean;
    constructor(request: IncomingMessage, response: ServerResponse);
    send(message: any): Promise<void>;
    readRequest(maxPayloadKb?: number, dontEmit?: boolean): Promise<ICoreRequestPayload<any, any>>;
}
