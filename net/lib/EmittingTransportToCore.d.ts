import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import '@ulixee/commons/lib/SourceMapSupport';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
export default class EmittingTransportToCore extends TypedEventEmitter<ITransportEvents & {
    outbound: any;
}> implements ITransport, ITypedEventEmitter<ITransportEvents & {
    outbound: any;
}> {
    host: string;
    isConnected: boolean;
    send(message: any): Promise<void>;
    connect(): Promise<void>;
    disconnect(): void;
}
