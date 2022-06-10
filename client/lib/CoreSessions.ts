import Queue from '@ulixee/commons/lib/Queue';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import CoreSession from './CoreSession';

export default class CoreSessions {
  public set concurrency(value: number) {
    this.queue.concurrency = value;
  }

  private readonly sessionsById = new Map<string, CoreSession>();
  private readonly queue: Queue;
  private readonly sessionTimeoutMillis: number;

  constructor(
    readonly connection: ConnectionToHeroCore,
    concurrency?: number,
    sessionTimeoutMillis?: number,
  ) {
    this.queue = new Queue('AGENT QUEUE');
    this.queue.concurrency = concurrency ?? 10;
    this.sessionTimeoutMillis = sessionTimeoutMillis;
  }

  public create(options: ISessionCreateOptions): Promise<CoreSession> {
    const sessionResolvable = new Resolvable<CoreSession>();
    void this.queue
      .run<void>(async () => {
        const sessionMeta = await this.connection.commandQueue.run<ISessionMeta>(
          'Core.createSession',
          options,
        );
        const coreSession = new CoreSession(sessionMeta, this.connection, options);
        const id = coreSession.sessionId;
        this.sessionsById.set(id, coreSession);
        coreSession.once('close', () => this.sessionsById.delete(id));

        sessionResolvable.resolve(coreSession);
        // wait for close before "releasing" this slot
        await new Promise(resolve => coreSession.once('close', resolve));
      }, this.sessionTimeoutMillis)
      .catch(sessionResolvable.reject);
    return sessionResolvable.promise;
  }

  public get size(): number {
    return this.sessionsById.size;
  }

  public hasAvailability(): boolean {
    return this.queue.canRunMoreConcurrently();
  }

  public get(sessionId: string): CoreSession | null {
    return this.sessionsById.get(sessionId);
  }

  public willStop(): void {
    this.queue.willStop();
  }

  public stop(closeError: Error): boolean {
    const hasSessions = this.sessionsById.size > 0;
    this.queue.stop(closeError);
    for (const session of this.sessionsById.values()) {
      session.close(true).catch(() => null);
    }
    return hasSessions;
  }
}
