"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
require("@double-agent/config/load");
const config_1 = require("@double-agent/config");
const SessionTracker_1 = require("./lib/SessionTracker");
const Certs_1 = require("./servers/Certs");
class Collect {
    constructor() {
        this.sessionTracker = new SessionTracker_1.default();
        if (config_1.default.collect.shouldGenerateProfiles) {
            console.log('\n\nGenerate Profiles mode activated!');
            return;
        }
        console.log(`
NOTE if not using dockers:
${Certs_1.CertsMessage}`);
    }
    async createSession(assignmentType, userAgentId, expectedUserAgentString) {
        const session = await this.sessionTracker.createSession(assignmentType, userAgentId);
        session.expectedUserAgentString = expectedUserAgentString;
        return session;
    }
    getSession(sessionId) {
        return this.sessionTracker.getSession(sessionId);
    }
    async deleteSession(session) {
        if (!session)
            return;
        await this.sessionTracker.deleteSession(session.id);
    }
    async shutdown() {
        await this.sessionTracker.shutdown();
    }
}
exports.default = Collect;
//# sourceMappingURL=index.js.map