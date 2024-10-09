"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const utils_1 = require("@ulixee/commons/lib/utils");
const WebSocket = require("ws");
const DisconnectedError_1 = require("../errors/DisconnectedError");
const WsUtils_1 = require("./WsUtils");
class WsTransportToCore extends eventUtils_1.TypedEventEmitter {
    constructor(host) {
        super();
        this.isConnected = false;
        this.isDisconnecting = false;
        this.events = new EventSubscriber_1.default();
        if (typeof host === 'string') {
            this.setHost(host);
        }
        this.onMessage = this.onMessage.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.onConnectError = this.onConnectError.bind(this);
        this.setHost = this.setHost.bind(this);
        this.hostPromise = Promise.resolve(host).then(this.setHost);
    }
    async send(payload) {
        await this.connect();
        const message = TypeSerializer_1.default.stringify(payload);
        try {
            await (0, WsUtils_1.wsSend)(this.webSocket, message);
        }
        catch (error) {
            const { code } = error;
            if (code === 'EPIPE' && this.isDisconnecting) {
                throw new DisconnectedError_1.default(this.host);
            }
            if (!(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                (0, WsUtils_1.sendWsCloseUnexpectedError)(this.webSocket, error.message);
            }
            throw error;
        }
    }
    disconnect() {
        if (this.isDisconnecting)
            return;
        this.isDisconnecting = true;
        this.emit('disconnected');
        this.isConnected = false;
        this.events.close('error');
        const webSocket = this.webSocket;
        this.webSocket = null;
        if ((0, WsUtils_1.isWsOpen)(webSocket)) {
            try {
                webSocket.terminate();
            }
            catch (_) {
                // ignore errors terminating
            }
        }
        return Promise.resolve();
    }
    async connect(timeoutMs) {
        if (!this.connectPromise) {
            this.connectPromise = new Resolvable_1.default();
            await this.hostPromise;
            const webSocket = new WebSocket(this.host, {
                followRedirects: false,
                handshakeTimeout: timeoutMs,
            });
            this.events.group('preConnect', this.events.once(webSocket, 'close', this.onConnectError), this.events.once(webSocket, 'error', this.onConnectError));
            this.events.once(webSocket, 'open', () => {
                this.events.once(webSocket, 'close', this.disconnect);
                this.events.on(webSocket, 'error', this.disconnect);
                this.events.endGroup('preConnect');
                this.connectPromise.resolve();
            });
            this.webSocket = webSocket;
            this.events.on(webSocket, 'message', this.onMessage);
        }
        await this.connectPromise;
        this.isConnected = true;
        this.emit('connected');
    }
    onMessage(message) {
        const payload = TypeSerializer_1.default.parse(message.toString(), 'REMOTE CORE');
        this.emit('message', payload);
    }
    onConnectError(error) {
        if (error instanceof Error)
            this.connectPromise.reject(error);
        else
            this.connectPromise.reject(new Error(`Error connecting to Websocket host -> ${error}`), true);
    }
    setHost(host) {
        const url = (0, utils_1.toUrl)(host);
        this.host = url.href;
    }
}
exports.default = WsTransportToCore;
//# sourceMappingURL=WsTransportToCore.js.map