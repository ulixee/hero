"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RemoteEventTarget_1 = require("./RemoteEventTarget");
class RemoteEvents {
    constructor(session, onCoreEvent) {
        this.session = session;
        this.onCoreEvent = onCoreEvent;
        this.remoteTargets = new Map();
        this.close = this.close.bind(this);
        session.once('closing', this.close);
    }
    close() {
        this.session.off('closing', this.close);
        this.session = null;
        for (const target of this.remoteTargets.values()) {
            target.close();
        }
        this.remoteTargets.clear();
    }
    getEventTarget(meta) {
        const session = this.session;
        let target = session;
        const tab = session.getTab(meta.tabId);
        if (tab)
            target = tab;
        if (meta.frameId) {
            target = tab?.getFrameEnvironment(meta.frameId);
        }
        if (!this.remoteTargets.has(target)) {
            this.remoteTargets.set(target, new RemoteEventTarget_1.default(this.session, target, meta, this.onCoreEvent));
        }
        return this.remoteTargets.get(target);
    }
}
exports.default = RemoteEvents;
//# sourceMappingURL=RemoteEvents.js.map