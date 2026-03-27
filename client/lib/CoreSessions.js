"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = require("@ulixee/commons/lib/Queue");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const CoreSession_1 = require("./CoreSession");
class CoreSessions {
    set concurrency(value) {
        this.queue.concurrency = value;
    }
    constructor(connection, concurrency, sessionTimeoutMillis) {
        this.connection = connection;
        this.sessionsById = new Map();
        this.queue = new Queue_1.default('AGENT QUEUE');
        this.queue.concurrency = concurrency ?? 10;
        this.sessionTimeoutMillis = sessionTimeoutMillis;
    }
    create(options, callsiteLocator) {
        const sessionResolvable = new Resolvable_1.default();
        void this.queue
            .run(async () => {
            const sessionMeta = await this.connection.commandQueue.run('Core.createSession', options);
            const coreSession = new CoreSession_1.default(sessionMeta, this.connection, options, callsiteLocator);
            const id = coreSession.sessionId;
            this.sessionsById.set(id, coreSession);
            coreSession.once('close', () => this.sessionsById.delete(id));
            sessionResolvable.resolve(coreSession);
            // wait for close before "releasing" this slot
            await new Promise(resolve => coreSession.once('close', resolve));
        }, { timeoutMillis: this.sessionTimeoutMillis })
            .catch(sessionResolvable.reject);
        return sessionResolvable.promise;
    }
    get size() {
        return this.sessionsById.size;
    }
    hasAvailability() {
        return this.queue.canRunMoreConcurrently();
    }
    get(sessionId) {
        return this.sessionsById.get(sessionId);
    }
    willStop() {
        this.queue.willStop();
    }
    stop(closeError) {
        const hasSessions = this.sessionsById.size > 0;
        this.queue.stop(closeError);
        for (const session of this.sessionsById.values()) {
            session.close(true).catch(() => null);
        }
        return hasSessions;
    }
}
exports.default = CoreSessions;
//# sourceMappingURL=CoreSessions.js.map