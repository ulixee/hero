import '@ulixee/commons/lib/SourceMapSupport';
import '@double-agent/config/load';
import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import Config from '@double-agent/config';
import SessionTracker from './lib/SessionTracker';
import Session from './lib/Session';
import { CertsMessage } from './servers/Certs';

export default class Collect {
  private sessionTracker: SessionTracker = new SessionTracker();

  constructor() {
    if (Config.collect.shouldGenerateProfiles) {
      console.log('\n\nGenerate Profiles mode activated!');
      return;
    }

    console.log(`
NOTE if not using dockers:
${CertsMessage}`);
  }

  public async createSession(
    assignmentType: IAssignmentType,
    userAgentId: string,
    expectedUserAgentString?: string,
  ): Promise<Session> {
    const session = await this.sessionTracker.createSession(assignmentType, userAgentId);
    session.expectedUserAgentString = expectedUserAgentString;

    return session;
  }

  public getSession(sessionId: string): Session {
    return this.sessionTracker.getSession(sessionId);
  }

  public async deleteSession(session: Session): Promise<void> {
    if (!session) return;
    await this.sessionTracker.deleteSession(session.id);
  }

  public async shutdown(): Promise<void> {
    await this.sessionTracker.shutdown();
  }
}
