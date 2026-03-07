import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import * as http from 'http';
import * as http2 from 'http2';
import Session from './Session';
import BaseServer from '../servers/BaseServer';
export default class SessionTracker {
    private pluginDelegate;
    private sessions;
    private sessionExpiryById;
    createSession(assignmentType: IAssignmentType, userAgentId: string): Promise<Session>;
    getSession(sessionId: string): Session;
    touchSession(sessionId: string): void;
    getSessionIdFromServerRequest(server: BaseServer, req: http.IncomingMessage | http2.Http2ServerRequest): string;
    getSessionFromServerRequest(server: BaseServer, req: http.IncomingMessage | http2.Http2ServerRequest): Session;
    deleteSession(sessionId: string): Promise<void>;
    shutdown(): Promise<void>;
    private scheduleSessionExpiry;
    private clearSessionExpiry;
    private clearAllSessionExpiry;
}
