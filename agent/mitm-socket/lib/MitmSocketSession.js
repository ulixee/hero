"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseIpcHandler_1 = require("./BaseIpcHandler");
class MitmSocketSession extends BaseIpcHandler_1.default {
    constructor(logger, options) {
        super({ ...options, mode: 'proxy' });
        this.socketsById = new Map();
        this.logger = logger.createChild(module);
    }
    async requestSocket(socket) {
        const id = socket.id;
        this.socketsById.set(id, socket);
        socket.once('close', () => this.socketsById.delete(id));
        await this.waitForConnected;
        try {
            await this.sendIpcMessage({
                id,
                socketPath: socket.socketPath,
                ...socket.connectOpts,
            });
        }
        catch (error) {
            if (this.isClosing) {
                return null;
            }
            this.logger.info('MitmSocketSession.requestSocketError', {
                error,
            });
        }
    }
    onMessage(rawMessage) {
        if (this.isClosing)
            return;
        const message = JSON.parse(rawMessage);
        if (this.options.debug) {
            this.logger.info('MitmSocketSession.onMessage', {
                ...message,
            });
        }
        if (message?.id) {
            this.socketsById.get(message.id)?.onMessage(message);
        }
    }
    beforeExit() {
        for (const socket of this.socketsById.values()) {
            socket.onExit();
        }
        this.socketsById.clear();
    }
}
exports.default = MitmSocketSession;
//# sourceMappingURL=MitmSocketSession.js.map