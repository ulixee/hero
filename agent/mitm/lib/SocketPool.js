"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = require("@ulixee/commons/lib/Queue");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
class SocketPool {
    constructor(origin, maxConnections, session) {
        this.maxConnections = maxConnections;
        this.session = session;
        this.isClosing = false;
        this.events = new EventSubscriber_1.default();
        this.all = new Set();
        this.pooled = 0;
        this.free = new Set();
        this.pending = [];
        this.http2Sessions = [];
        this.logger = session.logger.createChild(module, { origin });
        this.queue = new Queue_1.default('SOCKET TO ORIGIN');
    }
    freeSocket(socket) {
        this.free.add(socket);
        const pending = this.pending.shift();
        if (pending) {
            pending.resolve();
        }
    }
    async isHttp2(isWebsocket, createSocket) {
        if (this.alpn)
            return this.alpn === 'h2';
        if (this.queue.isActive) {
            // eslint-disable-next-line require-await
            const alpn = await this.queue.run(() => Promise.resolve(this.alpn));
            if (alpn)
                return alpn === 'h2';
        }
        try {
            const socket = await this.getSocket(isWebsocket, createSocket);
            this.freeSocket(socket);
            return socket.isHttp2();
        }
        catch (err) {
            if (this.session.isClosing)
                return false;
            throw err;
        }
    }
    getSocket(isWebsocket, createSocket) {
        return this.queue.run(async () => {
            const http2Session = this.getHttp2Session();
            if (http2Session && !isWebsocket) {
                return Promise.resolve(http2Session.mitmSocket);
            }
            if (this.pooled >= this.maxConnections && (this.pending.length || this.free.size === 0)) {
                const pending = new Resolvable_1.default();
                this.pending.push(pending);
                await pending.promise;
            }
            if (this.free.size) {
                const first = this.free.values().next().value;
                this.free.delete(first);
                if (first)
                    return first;
            }
            const mitmSocket = await createSocket();
            this.events.on(mitmSocket, 'close', this.onSocketClosed.bind(this, mitmSocket));
            this.alpn = mitmSocket.alpn;
            this.all.add(mitmSocket);
            // don't put connections that can't be reused into the pool
            if (!mitmSocket.isHttp2() && !isWebsocket) {
                this.pooled += 1;
            }
            return mitmSocket;
        });
    }
    close() {
        this.queue.willStop();
        for (const pending of this.pending) {
            pending.reject(new IPendingWaitEvent_1.CanceledPromiseError('Shutting down socket pool'), true);
        }
        this.pending.length = 0;
        for (const session of this.http2Sessions) {
            try {
                session.mitmSocket.close();
                session.client.destroy();
                session.client.unref();
                session.binding.events.close();
                if (!session.client.socket.destroyed)
                    session.client.socket.destroy();
                session.client.close();
            }
            catch (err) {
                // don't need to log closing sessions
            }
        }
        this.http2Sessions.length = 0;
        for (const socket of this.all) {
            socket.close();
        }
        this.events.close();
        this.all.clear();
        this.free.clear();
        this.queue.stop(new IPendingWaitEvent_1.CanceledPromiseError('Shutting down socket pool'));
    }
    getHttp2Session() {
        return this.http2Sessions[0];
    }
    registerHttp2Session(client, mitmSocket, binding) {
        if (this.http2Sessions.some(x => x.client === client))
            return;
        const entry = { mitmSocket, client, binding };
        this.http2Sessions.push(entry);
        this.events.on(client, 'close', () => this.closeHttp2Session(entry));
        this.events.on(mitmSocket, 'close', () => this.closeHttp2Session(entry));
        this.events.on(client, 'goaway', () => this.closeHttp2Session(entry));
    }
    onSocketClosed(socket) {
        this.logger.stats('Socket closed');
        this.session.emit('socket-close', { socket });
        this.free.delete(socket);
        if (this.all.delete(socket)) {
            this.pooled -= 1;
        }
        if (this.session.isClosing || socket.isWebsocket || socket.isHttp2())
            return;
        if (this.pooled < this.maxConnections)
            this.pending.shift()?.resolve();
    }
    closeHttp2Session(session) {
        const idx = this.http2Sessions.indexOf(session);
        if (idx >= 0)
            this.http2Sessions.splice(idx, 1);
        const { mitmSocket, client } = session;
        client.close();
        mitmSocket.close();
    }
}
exports.default = SocketPool;
//# sourceMappingURL=SocketPool.js.map