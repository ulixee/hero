import Queue from '@secret-agent/commons/Queue';
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

  public async waitForAvailable(callbackFn: () => Promise<any>): Promise<void> {
    await this.queue.run(async () => await callbackFn(), this.sessionTimeoutMillis);
  }

  public get(sessionId: string): CoreSession | null {
    return this.sessionsById.get(sessionId);
  }

  public close(closeError: Error): boolean {
    const hasSessions = this.sessionsById.size > 0;
    this.queue.stop(closeError);
    this.sessionsById.clear();
    return hasSessions;
  }

  public track(coreSession: CoreSession): void {
    this.sessionsById.set(coreSession.sessionId, coreSession);
  }

  public untrack(sessionId: string): void {
    this.sessionsById.delete(sessionId);
  }
}
