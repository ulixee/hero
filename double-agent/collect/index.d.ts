import '@ulixee/commons/lib/SourceMapSupport';
import '@double-agent/config/load';
import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import Session from './lib/Session';
export default class Collect {
    private sessionTracker;
    constructor();
    createSession(assignmentType: IAssignmentType, userAgentId: string, expectedUserAgentString?: string): Promise<Session>;
    getSession(sessionId: string): Session;
    deleteSession(session: Session): Promise<void>;
    shutdown(): Promise<void>;
}
