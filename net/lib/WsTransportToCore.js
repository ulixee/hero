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
    get isConnected() {
        return this.connectPromise?.isResolved === true && (0, WsUtils_1.isWsOpen)(this.webSocket);
    }
    constructor(host) {
        super();
        this.isDisconnecting = false;
        this.events = new EventSubscriber_1.default();
        if (typeof host === 'string') {
            this.setHost(host);
        }
        this.onMessage = this.onMessage.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.setHost = this.setHost.bind(this);
        this.hostPromise = Promise.resolve(host).then(this.setHost);
    }
    async send(payload) {
        if (!(0, WsUtils_1.isWsOpen)(this.webSocket)) {
            this.disconnect();
            throw new DisconnectedError_1.default(this.host);
        }
        const message = TypeSerializer_1.default.stringify(payload);
        try {
            await (0, WsUtils_1.wsSend)(this.webSocket, message);
        }
        catch (error) {
            if (!(0, WsUtils_1.isWsOpen)(this.webSocket)) {
                this.disconnect();
            }
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
        this.connectPromise = null;
        this.emit('disconnected');
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
    }
    async connect(timeoutMs) {
        if (!this.connectPromise) {
            await this.hostPromise;
            const connectPromise = new Resolvable_1.default();
            this.connectPromise = connectPromise;
            const webSocket = new WebSocket(this.host, {
                followRedirects: false,
                handshakeTimeout: timeoutMs,
            });
            this.isDisconnecting = false;
            this.events.group('preConnect', this.events.once(webSocket, 'close', (code, reason) => {
                connectPromise.reject(new Error(`Error connecting to Websocket host -> Unexpected close code ${code} - ${reason}`), true);
            }), this.events.once(webSocket, 'error', err => connectPromise.reject(err, true)));
            this.events.once(webSocket, 'open', () => {
                this.events.once(webSocket, 'close', this.disconnect);
                this.events.on(webSocket, 'error', this.disconnect);
                this.events.endGroup('preConnect');
                connectPromise.resolve();
            });
            this.webSocket = webSocket;
            this.events.on(webSocket, 'message', this.onMessage);
        }
        await this.connectPromise;
        this.emit('connected');
    }
    onMessage(message) {
        const payload = TypeSerializer_1.default.parse(message.toString(), 'REMOTE CORE');
        this.emit('message', payload);
    }
    setHost(host) {
        const url = (0, utils_1.toUrl)(host);
        this.host = url.href;
    }
}
exports.default = WsTransportToCore;
//# sourceMappingURL=WsTransportToCore.js.map