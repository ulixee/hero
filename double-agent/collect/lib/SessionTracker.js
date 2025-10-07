"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session_1 = require("./Session");
const PluginDelegate_1 = require("./PluginDelegate");
let sessionIdCounter = 0;
class SessionTracker {
    constructor() {
        this.pluginDelegate = new PluginDelegate_1.default();
        this.sessions = {};
    }
    async createSession(assignmentType, userAgentId) {
        const sessionId = String((sessionIdCounter += 1));
        console.log('CREATED SESSION ', sessionId, userAgentId);
        const session = new Session_1.default(sessionId, userAgentId, assignmentType, this, this.pluginDelegate);
        await session.startServers();
        this.sessions[sessionId] = session;
        return session;
    }
    getSession(sessionId) {
        return this.sessions[sessionId];
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
        await this.sessions[sessionId].close();
        delete this.sessions[sessionId];
    }
    async shutdown() {
        await Promise.allSettled(Object.values(this.sessions).map((x) => x.close()));
        await Promise.allSettled(this.pluginDelegate.plugins.map((x) => x.stop()));
    }
}
exports.default = SessionTracker;
//# sourceMappingURL=SessionTracker.js.map