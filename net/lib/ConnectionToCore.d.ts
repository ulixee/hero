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
export interface IConnectAction {
    isCallingHook?: boolean;
    hookMessageId?: string;
    startTime: IUnixTime;
    isAutomatic: boolean;
    resolvable: IResolvablePromise<void>;
    error?: Error;
}
export default class ConnectionToCore<TCoreApiHandlers extends IApiHandlers, TEventSpec> extends TypedEventEmitter<IConnectionToCoreEvents<TEventSpec>> {
    transport: ITransport;
    static MinimumAutoReconnectMillis: number;
    connectAction: IConnectAction;
    disconnectAction: IConnectAction;
    autoReconnect: boolean;
    hooks: {
        afterConnectFn?: (action: IConnectAction) => Promise<void>;
        beforeDisconnectFn?: (action: IConnectAction) => Promise<void>;
        afterDisconnectHook?: () => Promise<void>;
    };
    protected pendingMessages: PendingMessages<IApiSpec<TCoreApiHandlers>[any]["result"]>;
    protected events: EventSubscriber;
    protected didCallConnectionTerminated: boolean;
    protected lastDisconnectDate?: Date;
    constructor(transport: ITransport);
    connect(options?: {
        timeoutMs?: number;
        isAutoConnect?: boolean;
        shouldAutoReconnect?: boolean;
    }): Promise<void>;
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
    shouldAutoConnect(): boolean;
    protected onMessage(payload: ICoreResponsePayload<TCoreApiHandlers, any> | ICoreEventPayload<TEventSpec, any>): void;
    protected onResponse(message: ICoreResponsePayload<any, any>): void;
    protected onEvent(event: ICoreEventPayload<TEventSpec, any>): void;
    protected onConnectionTerminated(): Promise<void>;
    private afterConnectHook;
    private beforeDisconnectHook;
}
