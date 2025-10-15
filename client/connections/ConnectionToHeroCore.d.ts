import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { ConnectionToCore } from '@ulixee/net';
import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import ITransport from '@ulixee/net/interfaces/ITransport';
import { IConnectAction } from '@ulixee/net/lib/ConnectionToCore';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import CallsiteLocator from '../lib/CallsiteLocator';
import CoreCommandQueue from '../lib/CoreCommandQueue';
import CoreSession from '../lib/CoreSession';
export default class ConnectionToHeroCore extends ConnectionToCore<any, {}> {
    readonly commandQueue: CoreCommandQueue;
    options: IConnectionToCoreOptions;
    private coreSessions;
    constructor(transport: ITransport, options?: Omit<IConnectionToCoreOptions, 'host'>, callsiteLocator?: CallsiteLocator);
    sendRequest(payload: Omit<ICoreCommandRequestPayload, 'messageId' | 'sendTime'>, timeoutMs?: number): Promise<ICoreResponsePayload<any, any>['data']>;
    hasActiveSessions(): boolean;
    createSession(options: ISessionCreateOptions, callsiteLocator: CallsiteLocator): Promise<CoreSession>;
    getSession(sessionId: string): CoreSession;
    logUnhandledError(error: Error): Promise<void>;
    protected afterConnect(connectAction: IConnectAction): Promise<void>;
    protected afterDisconnectHook(): Promise<void>;
    protected beforeDisconnect(disconnectAction: IConnectAction): Promise<void>;
    protected onEvent(payload: ICoreListenerPayload): void;
    static remote(address: string): ConnectionToHeroCore;
    static resolveHost(host: string): string;
}
