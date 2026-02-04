import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import * as http from 'http';
import * as http2 from 'http2';
import Config from '@double-agent/config';
import Session from './Session';
import PluginDelegate from './PluginDelegate';
import BaseServer from '../servers/BaseServer';

let sessionIdCounter = 0;

export default class SessionTracker {
  private pluginDelegate: PluginDelegate = new PluginDelegate();
  private sessions: { [sessionId: string]: Session } = {};
  private sessionExpiryById: { [sessionId: string]: NodeJS.Timeout } = {};

  public async createSession(
    assignmentType: IAssignmentType,
    userAgentId: string,
  ): Promise<Session> {
    const sessionId = String((sessionIdCounter += 1));
    console.log('CREATED SESSION ', sessionId, userAgentId);
    const session = new Session(sessionId, userAgentId, assignmentType, this, this.pluginDelegate);
    await session.startServers();

    this.sessions[sessionId] = session;
    this.scheduleSessionExpiry(sessionId);
    return session;
  }

  public getSession(sessionId: string): Session {
    return this.sessions[sessionId];
  }

  public touchSession(sessionId: string): void {
    this.scheduleSessionExpiry(sessionId);
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
    this.clearSessionExpiry(sessionId);
    await this.sessions[sessionId].close();
    delete this.sessions[sessionId];
  }

  public async shutdown(): Promise<void> {
    await Promise.allSettled(Object.values(this.sessions).map((x) => x.close()));
    await Promise.allSettled(this.pluginDelegate.plugins.map((x) => x.stop()));
    this.clearAllSessionExpiry();
  }

  private scheduleSessionExpiry(sessionId: string): void {
    const ttlMs = Config.collect.sessionTtlMs;
    if (!ttlMs || ttlMs <= 0) return;
    this.clearSessionExpiry(sessionId);
    const timeout = setTimeout(() => {
      console.warn('Session expired due to inactivity/ttl', sessionId);
      void this.deleteSession(sessionId);
    }, ttlMs);
    timeout.unref();
    this.sessionExpiryById[sessionId] = timeout;
  }

  private clearSessionExpiry(sessionId: string): void {
    const timeout = this.sessionExpiryById[sessionId];
    if (timeout) {
      clearTimeout(timeout);
      delete this.sessionExpiryById[sessionId];
    }
  }

  private clearAllSessionExpiry(): void {
    for (const sessionId of Object.keys(this.sessionExpiryById)) {
      this.clearSessionExpiry(sessionId);
    }
  }
}
