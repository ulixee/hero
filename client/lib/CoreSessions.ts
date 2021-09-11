import Queue from '@ulixee/commons/lib/Queue';
import CoreSession from './CoreSession';

export default class CoreSessions {
  public set concurrency(value: number) {
    this.queue.concurrency = value;
  }

  private readonly sessionsById = new Map<string, CoreSession>();
  private readonly queue: Queue;
  private readonly sessionTimeoutMillis: number;

  constructor(concurrency?: number, sessionTimeoutMillis?: number) {
    this.queue = new Queue('AGENT QUEUE');
    this.queue.concurrency = concurrency ?? 1;
    this.sessionTimeoutMillis = sessionTimeoutMillis;
  }

  public waitForAvailable(callbackFn: () => Promise<any>): Promise<void> {
    return this.queue.run(callbackFn, this.sessionTimeoutMillis);
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
      session.close().catch(() => null);
    }
    return hasSessions;
  }

  public track(coreSession: CoreSession): void {
    this.sessionsById.set(coreSession.sessionId, coreSession);
  }

  public untrack(sessionId: string): void {
    this.sessionsById.delete(sessionId);
  }
}
