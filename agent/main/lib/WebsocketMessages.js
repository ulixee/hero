"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
class WebsocketMessages extends eventUtils_1.TypedEventEmitter {
    constructor(logger) {
        super();
        this.websocketMessages = [];
        this.websocketListeners = {};
        this.messageIdCounter = 0;
        this.logger = logger.createChild(module);
    }
    cleanup() {
        this.websocketListeners = {};
        this.websocketMessages.length = 0;
    }
    getMessages(resourceId) {
        const messages = [];
        for (const message of this.websocketMessages) {
            if (message.resourceId === resourceId) {
                messages.push(message);
            }
        }
        return messages;
    }
    listen(resourceId, listenerFn) {
        if (!this.websocketListeners[resourceId]) {
            this.websocketListeners[resourceId] = [];
        }
        this.websocketListeners[resourceId].push(listenerFn);
        // push all existing
        for (const message of this.websocketMessages) {
            if (message.resourceId === resourceId) {
                listenerFn(message);
            }
        }
    }
    unlisten(resourceId, listenerFn) {
        const listeners = this.websocketListeners[resourceId];
        if (!listeners)
            return;
        const idx = listeners.indexOf(listenerFn);
        if (idx >= 0)
            listeners.splice(idx, 1);
    }
    record(event, isMitmEnabled) {
        if (!event.resourceId && isMitmEnabled) {
            return;
        }
        const { resourceId, isFromServer, message, timestamp } = event;
        const resourceMessage = {
            resourceId,
            message,
            messageId: (this.messageIdCounter += 1),
            source: isFromServer ? 'server' : 'client',
            timestamp,
        };
        this.websocketMessages.push(resourceMessage);
        this.emit('new', { lastCommandId: event.lastCommandId, message: resourceMessage });
        const listeners = this.websocketListeners[resourceMessage.resourceId];
        if (listeners) {
            for (const listener of listeners) {
                listener(resourceMessage);
            }
        }
        return resourceMessage;
    }
}
exports.default = WebsocketMessages;
//# sourceMappingURL=WebsocketMessages.js.map