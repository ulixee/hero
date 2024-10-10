import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import * as http from 'http';
import * as http2 from 'http2';
import Session from './Session';
import BaseServer from '../servers/BaseServer';
export default class SessionTracker {
    private pluginDelegate;
    private sessions;
    createSession(assignmentType: IAssignmentType, userAgentId: string): Promise<Session>;
    getSession(sessionId: string): Session;
    getSessionIdFromServerRequest(server: BaseServer, req: http.IncomingMessage | http2.Http2ServerRequest): string;
    getSessionFromServerRequest(server: BaseServer, req: http.IncomingMessage | http2.Http2ServerRequest): Session;
    deleteSession(sessionId: string): Promise<void>;
    shutdown(): Promise<void>;
}
