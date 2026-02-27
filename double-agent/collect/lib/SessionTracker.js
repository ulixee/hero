"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@double-agent/config");
const Session_1 = require("./Session");
const PluginDelegate_1 = require("./PluginDelegate");
let sessionIdCounter = 0;
class SessionTracker {
    constructor() {
        this.pluginDelegate = new PluginDelegate_1.default();
        this.sessions = {};
        this.sessionExpiryById = {};
    }
    async createSession(assignmentType, userAgentId) {
        const sessionId = String((sessionIdCounter += 1));
        console.log('CREATED SESSION ', sessionId, userAgentId);
        const session = new Session_1.default(sessionId, userAgentId, assignmentType, this, this.pluginDelegate);
        await session.startServers();
        this.sessions[sessionId] = session;
        this.scheduleSessionExpiry(sessionId);
        return session;
    }
    getSession(sessionId) {
        return this.sessions[sessionId];
    }
    touchSession(sessionId) {
        this.scheduleSessionExpiry(sessionId);
    }
    getSessionIdFromServerRequest(server, req) {
        const requestUrl = server.getRequestUrl(req);
        const sessionId = requestUrl.searchParams.get('sessionId');
        if (!sessionId)
            throw new Error(`Missing session: ${requestUrl}`);
        return sessionId;
    }
    getSessionFromServerRequest(server, req) {
        const sessionId = this.getSessionIdFromServerRequest(server, req);
        return this.sessions[sessionId];
    }
    async deleteSession(sessionId) {
        if (!this.sessions[sessionId])
            return;
        this.clearSessionExpiry(sessionId);
        await this.sessions[sessionId].close();
        delete this.sessions[sessionId];
    }
    async shutdown() {
        await Promise.allSettled(Object.values(this.sessions).map((x) => x.close()));
        await Promise.allSettled(this.pluginDelegate.plugins.map((x) => x.stop()));
        this.clearAllSessionExpiry();
    }
    scheduleSessionExpiry(sessionId) {
        const ttlMs = config_1.default.collect.sessionTtlMs;
        if (!ttlMs || ttlMs <= 0)
            return;
        this.clearSessionExpiry(sessionId);
        const timeout = setTimeout(() => {
            console.warn('Session expired due to inactivity/ttl', sessionId);
            void this.deleteSession(sessionId);
        }, ttlMs);
        timeout.unref();
        this.sessionExpiryById[sessionId] = timeout;
    }
    clearSessionExpiry(sessionId) {
        const timeout = this.sessionExpiryById[sessionId];
        if (timeout) {
            clearTimeout(timeout);
            delete this.sessionExpiryById[sessionId];
        }
    }
    clearAllSessionExpiry() {
        for (const sessionId of Object.keys(this.sessionExpiryById)) {
            this.clearSessionExpiry(sessionId);
        }
    }
}
exports.default = SessionTracker;
//# sourceMappingURL=SessionTracker.js.map