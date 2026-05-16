import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IApiHandlers from '../interfaces/IApiHandlers';
import IConnectionToClient, { IConnectionToClientEvents } from '../interfaces/IConnectionToClient';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ITransport from '../interfaces/ITransport';
export default class ConnectionToClient<IClientApiHandlers extends IApiHandlers, IEventSpec, IHandlerMetadata = any> extends TypedEventEmitter<IConnectionToClientEvents> implements IConnectionToClient<IClientApiHandlers, IEventSpec> {
    readonly transport: ITransport;
    readonly apiHandlers: IClientApiHandlers;
    disconnectPromise: Promise<void>;
    handlerMetadata?: IHandlerMetadata;
    private events;
    constructor(transport: ITransport, apiHandlers: IClientApiHandlers);
    disconnect(error?: Error): Promise<void>;
    sendEvent<T extends keyof IEventSpec>(event: ICoreEventPayload<IEventSpec, T>): void;
    protected handleRequest<T extends keyof IClientApiHandlers & string>(apiRequest: ICoreRequestPayload<IClientApiHandlers, T>): Promise<void>;
    private sendMessage;
}
