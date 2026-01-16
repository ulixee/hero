"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const { log } = (0, Logger_1.default)(module);
class RemoteEventTarget {
    constructor(session, target, meta, onCoreEvent) {
        this.session = session;
        this.target = target;
        this.meta = meta;
        this.onCoreEvent = onCoreEvent;
        this.listeners = new Set();
    }
    close() {
        for (const id of this.listeners) {
            void this.target.removeRemoteEventListener(id);
        }
    }
    isAllowedCommand(method) {
        return method === 'addEventListener' || method === 'removeEventListener';
    }
    async addEventListener(jsPath, type, options) {
        const result = await this.target.addRemoteEventListener(type, this.emitCoreEvent.bind(this, type), jsPath, options);
        this.listeners.add(result.listenerId);
        return result;
    }
    removeEventListener(listenerId, options) {
        this.listeners.delete(listenerId);
        return this.target.removeRemoteEventListener(listenerId, options);
    }
    emitCoreEvent(eventType, listenerId, ...data) {
        if (this.session?.isClosing) {
            if (this.session.commands.getRemoteEventListener(listenerId)?.type !== 'close') {
                log.stats('Canceling event broadcast. Session is closing', {
                    sessionId: this.session.id,
                    listenerId,
                    meta: this.meta,
                });
                return;
            }
        }
        this.onCoreEvent({
            meta: this.meta,
            eventType,
            listenerId,
            data,
            lastCommandId: this.session.commands.lastId,
        });
    }
}
exports.default = RemoteEventTarget;
//# sourceMappingURL=RemoteEventTarget.js.map