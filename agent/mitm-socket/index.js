"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line max-classes-per-file
const net = require("net");
const fs_1 = require("fs");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const IpcUtils_1 = require("@ulixee/commons/lib/IpcUtils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
let idCounter = 0;
class MitmSocket extends eventUtils_1.TypedEventEmitter {
    get isWebsocket() {
        return this.connectOpts.isWebsocket === true;
    }
    constructor(sessionId, logger, connectOpts) {
        super();
        this.sessionId = sessionId;
        this.connectOpts = connectOpts;
        this.alpn = 'http/1.1';
        // eslint-disable-next-line no-multi-assign
        this.id = (idCounter += 1);
        this.isConnected = false;
        this.isReused = false;
        this.isClosing = false;
        this.closedPromise = new Resolvable_1.default();
        this.receivedEOF = false;
        this.socketReadyPromise = new Resolvable_1.default();
        this.events = new EventSubscriber_1.default();
        this.callStack = new Error().stack.replace('Error:', '').trim();
        this.serverName = connectOpts.servername;
        this.logger = logger.createChild(module);
        this.connectOpts.isSsl ??= true;
        this.socketPath = (0, IpcUtils_1.createIpcSocketPath)(`agent-${sessionId}-${this.id}`);
        // start listening
        this.server = new net.Server().unref();
        this.events.on(this.server, 'connection', this.onConnected.bind(this));
        this.events.on(this.server, 'error', error => {
            if (this.isClosing)
                return;
            this.logger.warn('IpcSocketServerError', { error });
        });
        (0, fs_1.unlink)(this.socketPath, () => {
            this.server.listen(this.socketPath);
        });
        this.createTime = new Date();
        this.close = this.close.bind(this);
    }
    isReusable() {
        if (!this.socket || this.isClosing || !this.isConnected)
            return false;
        return this.socket.writable && !this.socket.destroyed;
    }
    setProxyUrl(url) {
        this.connectOpts.proxyUrl = url;
    }
    isHttp2() {
        return this.alpn === 'h2';
    }
    close() {
        if (this.isClosing)
            return;
        const parentLogId = this.logger.info(`MitmSocket.Closing`);
        this.isClosing = true;
        this.closeTime = new Date();
        if (!this.connectPromise?.isResolved) {
            this.connectPromise?.reject(buildConnectError(this.connectError ?? `Failed to connect to ${this.serverName}`, this.callStack));
        }
        this.emit('close');
        this.cleanupSocket();
        this.closedPromise.resolve(this.closeTime);
        this.events.close('error');
        this.removeAllListeners();
        this.logger.stats(`MitmSocket.Closed`, {
            parentLogId,
        });
    }
    onConnected(socket) {
        this.ipcConnectionTime = new Date();
        this.socket = socket;
        this.events.on(socket, 'error', error => {
            this.logger.warn('MitmSocket.SocketError', {
                sessionId: this.sessionId,
                error,
                socketPath: this.socketPath,
                host: this.connectOpts?.host,
            });
            if (error?.code === 'ENOENT') {
                this.errorTime = new Date();
                this.close();
            }
            this.isConnected = false;
        });
        this.events.on(socket, 'end', this.close);
        this.events.once(socket, 'close', this.close);
        this.socketReadyPromise.resolve();
    }
    async connect(session, connectTimeoutMillis = 30e3) {
        if (!this.server.listening) {
            await new Promise(resolve => this.events.once(this.server, 'listening', resolve));
        }
        if (session.isClosing || this.isClosing || !session)
            return;
        // minimum of 1 second
        if (connectTimeoutMillis < 1e3)
            connectTimeoutMillis = 1e3;
        this.connectPromise = new Resolvable_1.default(connectTimeoutMillis, `Timeout connecting to ${this.serverName ?? 'host'} at ${this.connectOpts.host}:${this.connectOpts.port}`);
        try {
            await Promise.all([
                session.requestSocket(this),
                this.connectPromise.promise,
                this.socketReadyPromise.promise,
            ]);
        }
        catch (error) {
            if (error instanceof TimeoutError_1.default && (session.isClosing || this.isClosing))
                return;
            throw error;
        }
    }
    onMessage(message) {
        const status = message?.status;
        if (status === 'connected') {
            this.connectTime = new Date();
            this.isConnected = true;
            if (message.alpn)
                this.alpn = message.alpn;
            if (message.rawApplicationSettings) {
                // settings are http2 frames
                this.rawApplicationSettings = Buffer.from(message.rawApplicationSettings, 'base64');
                const acceptChFrame = message.alps?.AcceptChPayload
                    ? Buffer.from(message.alps.AcceptChPayload, 'base64')
                    : null;
                let acceptCh;
                if (acceptChFrame) {
                    const originLength = acceptChFrame.readUint16BE();
                    const origin = acceptChFrame.subarray(2, originLength + 2).toString('utf8');
                    const headerLength = acceptChFrame.readUint16BE(3 + originLength);
                    const headers = acceptChFrame
                        .subarray(originLength + 4, originLength + 4 + headerLength)
                        .toString('utf8');
                    acceptCh = { domain: origin, headers: headers.split(',').map(x => x.trim()) };
                }
                this.alps = {
                    acceptCh,
                    settings: message.alps?.Settings?.map(x => {
                        return {
                            id: x.id,
                            value: x.Val,
                        };
                    }),
                };
            }
            this.remoteAddress = message.remoteAddress;
            this.localAddress = message.localAddress;
            this.emit('connect');
            this.connectPromise.resolve();
        }
        else if (status === 'error') {
            this.onError(message.error);
        }
        else if (status === 'eof') {
            this.receivedEOF = true;
            setImmediate(() => {
                if (this.isClosing)
                    return;
                this.emit('eof');
            });
        }
        else if (status === 'closing') {
            setImmediate(this.close.bind(this));
        }
    }
    onExit() {
        this.triggerConnectErrorIfNeeded(true);
        this.close();
    }
    triggerConnectErrorIfNeeded(isExiting = false) {
        if (this.connectPromise?.isResolved)
            return;
        if (isExiting && !this.connectError) {
            this.connectPromise.resolve();
            return;
        }
        this.connectPromise?.reject(buildConnectError(this.connectError ?? `Socket process exited during connect`, this.callStack));
    }
    onError(message) {
        this.errorTime = new Date();
        this.logger.info('MitmSocket.error', { message, host: this.connectOpts.host });
        if (message.includes('panic: runtime error:') ||
            message.includes('tlsConn.Handshake error') ||
            message.includes('connection refused') ||
            message.includes('no such host') ||
            message.includes('Dial (proxy/remote)') ||
            message.includes('PROXY_ERR')) {
            this.connectError = message.trim();
            if (this.connectError.includes('Error:')) {
                this.connectError = this.connectError.split('Error:').pop().trim();
            }
            this.triggerConnectErrorIfNeeded(false);
        }
        this.close();
    }
    cleanupSocket() {
        if (this.socket) {
            this.socket.unref();
            this.socket.destroy();
        }
        this.server.unref().close();
        this.server.removeAllListeners();
        this.isConnected = false;
        (0, fs_1.unlink)(this.socketPath, () => null);
        delete this.socket;
    }
}
exports.default = MitmSocket;
class Socks5ProxyConnectError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'Socks5ProxyConnectError';
    }
}
class HttpProxyConnectError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'HttpProxyConnectError';
    }
}
class SocketConnectError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'SocketConnectError';
    }
}
function buildConnectError(connectError, callStack) {
    let error;
    connectError ??= 'Error connecting to host';
    if (connectError.includes('SOCKS5_PROXY_ERR')) {
        error = new Socks5ProxyConnectError(connectError.replace('SOCKS5_PROXY_ERR', 'Socks5 Proxy Connect Error').trim());
    }
    else if (connectError.includes('HTTP_PROXY_ERR')) {
        error = new HttpProxyConnectError(connectError.replace('HTTP_PROXY_ERR', 'Http Proxy Connect Error').trim());
    }
    else {
        error = new SocketConnectError(connectError.trim());
    }
    error.stack += `\n${'------DIAL'.padEnd(50, '-')}\n    `;
    error.stack += callStack;
    return error;
}
//# sourceMappingURL=index.js.map