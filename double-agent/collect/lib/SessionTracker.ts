import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import * as http from 'http';
import * as http2 from 'http2';
import Session from './Session';
import PluginDelegate from './PluginDelegate';
import BaseServer from '../servers/BaseServer';

let sessionIdCounter = 0;

export default class SessionTracker {
  private pluginDelegate: PluginDelegate = new PluginDelegate();
  private sessions: { [sessionId: string]: Session } = {};

  public async createSession(
    assignmentType: IAssignmentType,
    userAgentId: string,
  ): Promise<Session> {
    const sessionId = String((sessionIdCounter += 1));
    console.log('CREATED SESSION ', sessionId, userAgentId);
    const session = new Session(sessionId, userAgentId, assignmentType, this, this.pluginDelegate);
    await session.startServers();

    this.sessions[sessionId] = session;
    return session;
  }

  public getSession(sessionId: string): Session {
    return this.sessions[sessionId];
  }

  public getSessionIdFromServerRequest(
    server: BaseServer,
    req: http.IncomingMessage | http2.Http2ServerRequest,
  ): string {
    const requestUrl = server.getRequestUrl(req);
    const sessionId = requestUrl.searchParams.get('sessionId');
    if (!sessionId) throw new Error(`Missing session: ${requestUrl}`);
    return sessionId;
  }

  public getSessionFromServerRequest(
    server: BaseServer,
    req: http.IncomingMessage | http2.Http2ServerRequest,
  ): Session {
    const sessionId = this.getSessionIdFromServerRequest(server, req);
    return this.sessions[sessionId];
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (!this.sessions[sessionId]) return;
    await this.sessions[sessionId].close();
    delete this.sessions[sessionId];
  }

  public async shutdown(): Promise<void> {
    await Promise.allSettled(Object.values(this.sessions).map((x) => x.close()));
    await Promise.allSettled(this.pluginDelegate.plugins.map((x) => x.stop()));
  }
}
