import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import '@ulixee/commons/lib/SourceMapSupport';
import ITransport, { ITransportEvents } from '../interfaces/ITransport';
type TEvents = ITransportEvents & {
    outbound: any;
};
export default class EmittingTransportToClient extends TypedEventEmitter<TEvents> implements ITransport, ITypedEventEmitter<TEvents> {
    remoteId: string;
    isConnected: boolean;
    send(message: any): Promise<void>;
}
export {};
