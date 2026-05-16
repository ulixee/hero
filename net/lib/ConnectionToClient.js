"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const { log } = (0, Logger_1.default)(module);
class ConnectionToClient extends eventUtils_1.TypedEventEmitter {
    constructor(transport, apiHandlers) {
        super();
        this.transport = transport;
        this.apiHandlers = apiHandlers;
        this.events = new EventSubscriber_1.default();
        if (transport) {
            this.events.on(transport, 'message', message => this.handleRequest(message));
            this.events.once(transport, 'disconnected', error => this.disconnect(error));
        }
    }
    disconnect(error) {
        if (this.disconnectPromise)
            return this.disconnectPromise;
        this.disconnectPromise = new Promise(async (resolve) => {
            try {
                this.events.close();
                await this.transport.disconnect?.();
            }
            finally {
                this.transport.emit('disconnected');
                this.emit('disconnected', error);
                resolve();
            }
        });
        return this.disconnectPromise;
    }
    sendEvent(event) {
        this.emit('event', { event });
        this.sendMessage(event);
    }
    async handleRequest(apiRequest) {
        if (!('messageId' in apiRequest) && !('command' in apiRequest))
            return;
        const { command, messageId } = apiRequest;
        let args = apiRequest.args ?? [];
        if (!Array.isArray(args))
            args = [apiRequest.args];
        if (this.handlerMetadata)
            args.push(this.handlerMetadata);
        const startTime = Date.now();
        let data;
        try {
            const handler = this.apiHandlers[command];
            if (!handler)
                throw new Error(`Unknown api requested: ${String(command)}`);
            this.emit('request', { request: apiRequest });
            data = await handler(...args);
        }
        catch (error) {
            error.stack ??= error.message;
            log.error(`Error running api`, { error, sessionId: args[0]?.heroSessionId });
            data = error;
        }
        const response = {
            responseId: messageId,
            data,
        };
        this.emit('response', {
            request: apiRequest,
            response,
            metadata: { milliseconds: Date.now() - startTime, startTime, messageId },
        });
        this.sendMessage(response);
    }
    sendMessage(message) {
        this.transport.send(message).catch(error => {
            this.emit('send-error', error);
        });
    }
}
exports.default = ConnectionToClient;
//# sourceMappingURL=ConnectionToClient.js.map