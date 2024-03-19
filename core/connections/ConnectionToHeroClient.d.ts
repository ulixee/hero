import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IConnectionToClient, { IConnectionToClientEvents } from '@ulixee/net/interfaces/IConnectionToClient';
import ITransport from '@ulixee/net/interfaces/ITransport';
import HeroCore from '../index';
import { ICommandableTarget } from '../lib/CommandRunner';
export default class ConnectionToHeroClient extends TypedEventEmitter<IConnectionToClientEvents> implements IConnectionToClient<any, {}>, ICommandableTarget {
    readonly transport: ITransport;
    private core;
    disconnectPromise: Promise<void>;
    private get autoShutdownMillis();
    private autoShutdownTimer;
    private readonly sessionIdToRemoteEvents;
    private activeCommandMessageIds;
    constructor(transport: ITransport, core: HeroCore);
    handleRequest(payload: ICoreCommandRequestPayload): Promise<void>;
    connect(options?: {
        maxConcurrentClientCount?: number;
        version?: string;
    }): Promise<{
        maxConcurrency: number;
    }>;
    logUnhandledError(error: Error, fatalError?: boolean): void;
    disconnect(fatalError?: Error): Promise<void>;
    isActive(): boolean;
    isAllowedCommand(method: string): boolean;
    sendEvent(message: ICoreListenerPayload): void;
    createSession(options?: ISessionCreateOptions): Promise<ISessionMeta>;
    private recordCommands;
    private executeCommand;
    private disconnectIfInactive;
    private checkForAutoShutdown;
    private isLaunchError;
    private serializeToMetadata;
    private serializeError;
}
