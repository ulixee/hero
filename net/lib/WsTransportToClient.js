"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const utils_1 = require("@ulixee/commons/lib/utils");
const WsUtils_1 = require("./WsUtils");
class WsTransportToClient extends eventUtils_1.TypedEventEmitter {
    constructor(webSocket, request) {
        super();
        this.webSocket = webSocket;
        this.request = request;
        this.isConnected = true;
        this.events = new EventSubscriber_1.default();
        (0, utils_1.bindFunctions)(this);
        this.events.on(webSocket, 'message', this.onMessage);
        this.events.on(webSocket, 'close', this.onDisconnect.bind(this, null));
        this.events.on(webSocket, 'error', this.onDisconnect);
        this.events.on(webSocket, 'pong', this.onPong);
        this.remoteId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
        this.lastActivity = Date.now();
        this.keepAlive = setInterval(this.checkAlive, 1000 * 10).unref();
    }
    async send(payload) {
        const message = TypeSerializer_1.default.stringify(payload);
        try {
            await (0, WsUtils_1.wsSend)(this.webSocket, message);
            this.lastActivity = Date.now();
        }
        catch (error) {
            if (!(0, WsUtils_1.isWsOpen)(this.webSocket)) {
                this.onDisconnect(error);
            }
            if (!(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                (0, WsUtils_1.sendWsCloseUnexpectedError)(this.webSocket, error.message);
            }
            throw error;
        }
    }
    disconnect(fatalError) {
        if ((0, WsUtils_1.isWsOpen)(this.webSocket)) {
            this.webSocket.close();
        }
        this.onDisconnect(fatalError);
    }
    checkAlive() {
        if (Date.now() - this.lastActivity > 30_000) {
            this.onDisconnect(new Error('No activity'));
            return;
        }
        this.webSocket.ping();
    }
    onPong() {
        this.lastActivity = Date.now();
    }
    onDisconnect(error) {
        this.isConnected = false;
        clearInterval(this.keepAlive);
        this.emit('disconnected', error);
        this.events.close();
    }
    onMessage(message) {
        this.lastActivity = Date.now();
        const payload = TypeSerializer_1.default.parse(message.toString(), 'CLIENT');
        this.emit('message', payload);
    }
}
exports.default = WsTransportToClient;
//# sourceMappingURL=WsTransportToClient.js.map