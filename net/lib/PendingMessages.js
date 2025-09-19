"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
class PendingMessages {
    constructor(marker = `\n${'------CONNECTION'.padEnd(50, '-')}\n`) {
        this.marker = marker;
        this.lastId = 0;
        this.pendingRequestsById = new Map();
        this.dontCancelIds = new Set();
    }
    cancel(error) {
        for (const id of this.pendingRequestsById.keys()) {
            if (this.dontCancelIds.has(id)) {
                continue;
            }
            this.reject(id, error);
        }
    }
    resolve(id, data) {
        this.pendingRequestsById.get(id)?.resolve(data);
        this.pendingRequestsById.delete(id);
    }
    reject(id, error) {
        const entry = this.pendingRequestsById.get(id);
        if (!entry)
            return;
        this.pendingRequestsById.delete(id);
        if (!error.stack.includes(this.marker)) {
            error.stack += `${this.marker}${entry.stack}`;
        }
        entry.reject(error);
    }
    delete(id) {
        this.pendingRequestsById.get(id)?.resolve();
        this.pendingRequestsById.delete(id);
    }
    create(timeoutMs, dontCancelId = false) {
        const resolvablePromise = (0, utils_1.createPromise)(timeoutMs);
        this.lastId += 1;
        const id = this.lastId.toString();
        if (dontCancelId) {
            this.dontCancelIds.add(id);
        }
        this.pendingRequestsById.set(id, resolvablePromise);
        return { id, promise: resolvablePromise.promise };
    }
}
exports.default = PendingMessages;
//# sourceMappingURL=PendingMessages.js.map