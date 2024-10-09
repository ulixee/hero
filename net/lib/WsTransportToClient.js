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
        this.events.on(webSocket, 'close', this.onClose);
        this.events.on(webSocket, 'error', this.onError);
        this.remoteId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
    }
    async send(payload) {
        const message = TypeSerializer_1.default.stringify(payload);
        try {
            await (0, WsUtils_1.wsSend)(this.webSocket, message);
        }
        catch (error) {
            if (!(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                (0, WsUtils_1.sendWsCloseUnexpectedError)(this.webSocket, error.message);
            }
            throw error;
        }
    }
    onClose() {
        this.isConnected = false;
        this.emit('disconnected', null);
        this.events.close();
    }
    onError(error) {
        this.emit('disconnected', error);
        this.events.close();
    }
    onMessage(message) {
        const payload = TypeSerializer_1.default.parse(message.toString(), 'CLIENT');
        this.emit('message', payload);
    }
}
exports.default = WsTransportToClient;
//# sourceMappingURL=WsTransportToClient.js.map