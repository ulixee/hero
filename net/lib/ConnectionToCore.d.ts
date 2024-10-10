import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IApiHandlers, { IApiSpec } from '../interfaces/IApiHandlers';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import ITransport from '../interfaces/ITransport';
import IUnixTime from '../interfaces/IUnixTime';
import PendingMessages from './PendingMessages';
export interface IConnectionToCoreEvents<IEventSpec> {
    disconnected: Error | null;
    connected: void;
    event: {
        event: ICoreEventPayload<IEventSpec, any>;
    };
}
export default class ConnectionToCore<TCoreApiHandlers extends IApiHandlers, TEventSpec> extends TypedEventEmitter<IConnectionToCoreEvents<TEventSpec>> {
    transport: ITransport;
    connectPromise: IResolvablePromise<void>;
    disconnectPromise: Promise<void>;
    connectStartTime: IUnixTime;
    didAutoConnect: boolean;
    disconnectStartTime: IUnixTime;
    disconnectError: Error;
    get isConnectedToTransport(): boolean;
    hooks: {
        afterConnectFn?: () => Promise<void>;
        beforeDisconnectFn?: () => Promise<void>;
    };
    protected connectMessageId: string;
    protected disconnectMessageId: string;
    protected pendingMessages: PendingMessages<IApiSpec<TCoreApiHandlers>[any]["result"]>;
    protected isConnectionTerminated: boolean;
    protected events: EventSubscriber;
    private isSendingConnect;
    private isSendingDisconnect;
    constructor(transport: ITransport, skipConnect?: boolean);
    connect(isAutoConnect?: boolean, timeoutMs?: number): Promise<void>;
    disconnect(fatalError?: Error): Promise<void>;
    sendRequest<T extends keyof TCoreApiHandlers & string>(payload: {
        command: T;
        args: IApiSpec<TCoreApiHandlers>[T]['args'];
        commandId?: number;
        startTime?: IUnixTime;
    }, timeoutMs?: number): Promise<ICoreResponsePayload<TCoreApiHandlers, T>['data']>;
    /**
     * Override fn to control active sessions
     */
    hasActiveSessions(): boolean;
    protected onMessage(payload: ICoreResponsePayload<TCoreApiHandlers, any> | ICoreEventPayload<TEventSpec, any>): void;
    protected onResponse(message: ICoreResponsePayload<any, any>): void;
    protected onEvent(event: ICoreEventPayload<TEventSpec, any>): void;
    protected onConnectionTerminated(): Promise<void>;
}
