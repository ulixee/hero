"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketTransport = void 0;
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const WebSocket = require("ws");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const { log } = (0, Logger_1.default)(module);
class WebsocketTransport {
    get url() {
        return this.webSocket.url;
    }
    constructor(urlPromise) {
        this.onCloseFns = [];
        this.connectedPromise = new Resolvable_1.default();
        this.isClosed = false;
        this.events = new EventSubscriber_1.default();
        urlPromise
            .then(url => this.connect(url))
            .catch(error => {
            if (!this.connectedPromise.isResolved)
                this.connectedPromise.reject(error);
        });
    }
    send(message) {
        if (this.webSocket?.readyState === WebSocket.OPEN) {
            this.webSocket.send(message);
            return true;
        }
        return false;
    }
    close() {
        this.isClosed = true;
        this.events.close();
        try {
            this.webSocket?.close();
        }
        catch { }
    }
    onClosed() {
        log.stats('WebSocketTransport.Closed');
        for (const close of this.onCloseFns)
            close();
    }
    onMessage(event) {
        this.onMessageFn?.(event);
    }
    connect(url) {
        url = url.replace('localhost', '127.0.0.1');
        this.webSocket = new WebSocket(url, [], {
            perMessageDeflate: false,
            followRedirects: true,
        });
        this.webSocket.once('open', this.connectedPromise.resolve);
        this.webSocket.once('error', err => this.connectedPromise.reject(err, true));
        this.events.on(this.webSocket, 'message', this.onMessage.bind(this));
        this.events.once(this.webSocket, 'close', this.onClosed.bind(this));
        this.events.once(this.webSocket, 'error', error => {
            if (!this.connectedPromise.isResolved)
                this.connectedPromise.reject(error, true);
            if (this.isClosed)
                return;
            if (error.code !== 'EPIPE') {
                log.error('WebsocketTransport.error', { error, sessionId: null });
            }
        });
    }
}
exports.WebsocketTransport = WebsocketTransport;
//# sourceMappingURL=WebsocketTransport.js.map