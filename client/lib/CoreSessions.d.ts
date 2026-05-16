import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import CoreSession from './CoreSession';
import CallsiteLocator from './CallsiteLocator';
export default class CoreSessions {
    readonly connection: ConnectionToHeroCore;
    set concurrency(value: number);
    private readonly sessionsById;
    private readonly queue;
    private readonly sessionTimeoutMillis;
    constructor(connection: ConnectionToHeroCore, concurrency?: number, sessionTimeoutMillis?: number);
    create(options: ISessionCreateOptions, callsiteLocator: CallsiteLocator): Promise<CoreSession>;
    get size(): number;
    hasAvailability(): boolean;
    get(sessionId: string): CoreSession | null;
    willStop(): void;
    stop(closeError: Error): boolean;
}
