"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketSession = void 0;
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const TypedEventEmitter_1 = require("@ulixee/commons/lib/TypedEventEmitter");
const http_1 = require("http");
const ws_1 = require("ws");
const SCRIPT_PLACEHOLDER = '';
const { log } = (0, Logger_1.default)(module);
class WebsocketSession extends TypedEventEmitter_1.default {
    constructor() {
        super();
        this.host = 'websocket.localhost';
        this.secret = Math.random().toString();
        // We store resolvable when we received websocket message before, receiving
        // targetId, this way we can await this, and still trigger to get proper ids.
        this.clientIdToTargetId = new Map();
        this.intervals = new Set();
        this.server = (0, http_1.createServer)();
        this.wss = new ws_1.Server({ noServer: true });
    }
    async initialize() {
        const resolver = new Resolvable_1.default(10e3);
        this.server.on('error', resolver.reject);
        this.server.listen(0, () => {
            const address = this.server.address();
            if (typeof address === 'string') {
                throw new Error('Unexpected server address format (string)');
            }
            this.port = address.port;
            resolver.resolve();
        });
        this.server.on('upgrade', this.handleUpgrade.bind(this));
        this.wss.on('connection', this.handleConnection.bind(this));
        return resolver.promise;
    }
    close() {
        this.wss.close();
        this.server.close();
        this.intervals.forEach(interval => clearInterval(interval));
    }
    isWebsocketUrl(url) {
        const parsed = new URL(url);
        return (parsed.hostname === this.host &&
            parsed.port === this.port.toString() &&
            parsed.searchParams.get('secret') === this.secret);
    }
    registerWebsocketFrameId(url, frameId) {
        const parsed = new URL(url);
        if (parsed.searchParams.get('secret') !== this.secret)
            return;
        const clientId = parsed.searchParams.get('clientId');
        if (!clientId)
            return;
        const targetId = this.clientIdToTargetId.get(clientId);
        if (targetId instanceof Resolvable_1.default) {
            targetId.resolve(frameId);
        }
        this.clientIdToTargetId.set(clientId, frameId);
    }
    injectWebsocketCallbackIntoScript(script) {
        // We could do this as a simple template script but this logic might get
        // complex over time and we want typescript to be able to check proxyScript();
        const scriptFn = injectedScript
            .toString()
            // eslint-disable-next-line no-template-curly-in-string
            .replaceAll('${this.host}', this.host)
            // eslint-disable-next-line no-template-curly-in-string
            .replaceAll('${this.port}', this.port.toString())
            // eslint-disable-next-line no-template-curly-in-string
            .replaceAll('${this.secret}', this.secret)
            // Use function otherwise replace will try todo some magic
            .replace('SCRIPT_PLACEHOLDER', () => script);
        const wsScript = `(${scriptFn})();`;
        return wsScript;
    }
    handleUpgrade(request, socket, head) {
        const url = new URL(request.url, `ws://${this.host}`);
        // Close and dont send 403 so this acts as an invisible websocket server
        if (url.searchParams.get('secret') !== this.secret) {
            socket.destroy();
        }
        const clientId = url.searchParams.get('clientId');
        this.wss.handleUpgrade(request, socket, head, ws => {
            this.wss.emit('connection', ws, request, clientId);
        });
    }
    handleConnection(ws, request, clientId) {
        ws.on('error', error => log.error('WebsocketSession.ConnectionError', { error }));
        ws.on('message', this.handleMessage.bind(this, clientId));
        let isAlive = true;
        ws.on('pong', () => {
            isAlive = true;
        });
        const interval = setInterval(() => {
            if (isAlive) {
                isAlive = false;
                return ws.ping();
            }
            this.clientIdToTargetId.delete(clientId);
            ws.terminate();
            clearInterval(interval);
            this.intervals.delete(interval);
        }, 30e3).unref();
        this.intervals.add(interval);
    }
    async handleMessage(clientId, data) {
        const { name, payload } = JSON.parse(data.toString());
        let frameId = this.clientIdToTargetId.get(clientId);
        if (!frameId) {
            const resolvable = new Resolvable_1.default();
            this.clientIdToTargetId.set(clientId, resolvable);
            frameId = await resolvable.promise;
        }
        else if (frameId instanceof Resolvable_1.default) {
            frameId = await frameId.promise;
        }
        this.emit('message-received', { id: frameId, name, payload });
    }
}
exports.WebsocketSession = WebsocketSession;
/** This function will be stringified and inserted as a wrapper script so all injected
 * scripts have access to a callback function (over a websocket). This function takes
 * care of setting up that websocket and all other logic it needs as glue to make it all work.
 * */
function injectedScript() {
    const clientId = Math.random();
    const url = `${this.host}:${this.port}?secret=${this.secret}&clientId=${clientId}`;
    // This will signal to network manager we are trying to make websocket connection
    // This is needed later to map clientId to frameId
    // eslint-disable-next-line no-console
    fetch(`http://${url}`).catch(error => console.log(error));
    let callback;
    try {
        const socket = new WebSocket(`ws://${url}`);
        let isReady = false;
        const queuedCallbacks = [];
        const sendOverSocket = (name, payload) => {
            try {
                socket.send(JSON.stringify({ name, payload }));
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.log(`failed to send over websocket: ${error}`);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        callback = (name, payload) => {
            if (!isReady) {
                queuedCallbacks.push({ name, payload });
                return;
            }
            sendOverSocket(name, payload);
        };
        socket.addEventListener('open', _event => {
            let queuedCallback = queuedCallbacks.shift();
            while (queuedCallback) {
                sendOverSocket(queuedCallback.name, queuedCallback.payload);
                queuedCallback = queuedCallbacks.shift();
            }
            // Only ready when all older messages have been send so we
            // keep original order of messages.
            isReady = true;
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log(`failed to use websocket: ${error}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    SCRIPT_PLACEHOLDER;
}
//# sourceMappingURL=WebsocketSession.js.map