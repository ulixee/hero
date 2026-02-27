"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const dnsPacket = require("dns-packet");
const utils_1 = require("@ulixee/commons/lib/utils");
const index_1 = require("@ulixee/unblocked-agent-mitm-socket/index");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const env_1 = require("../env");
class DnsOverTlsSocket {
    get host() {
        return this.dnsSettings.dnsOverTlsConnection?.host;
    }
    get isActive() {
        return this.mitmSocket.isReusable() && !this.isClosing;
    }
    constructor(dnsSettings, requestSession, onClose) {
        this.pending = new Map();
        this.buffer = null;
        this.isClosing = false;
        this.events = new EventSubscriber_1.default();
        this.requestSession = requestSession;
        this.logger = requestSession.logger.createChild(module);
        this.dnsSettings = dnsSettings;
        this.onClose = onClose;
    }
    async lookupARecords(host) {
        if (!this.isConnected) {
            this.isConnected = this.connect();
        }
        await this.isConnected;
        return this.getDnsResponse(host);
    }
    close() {
        if (this.isClosing)
            return;
        this.isClosing = true;
        this.mitmSocket?.close();
        this.events.close();
        this.requestSession = null;
        this.mitmSocket = null;
        if (this.onClose)
            this.onClose();
    }
    async connect() {
        const { host, port, servername } = this.dnsSettings.dnsOverTlsConnection || {};
        this.mitmSocket = new index_1.default(this.requestSession.sessionId, this.requestSession.logger, {
            host,
            servername,
            port: String(port ?? 853),
            isSsl: true,
            keepAlive: true,
            debug: env_1.default.isDebug,
        });
        await this.mitmSocket.connect(this.requestSession.requestAgent.socketSession, 10e3);
        this.events.on(this.mitmSocket.socket, 'data', this.onData.bind(this));
        const onCloseRegistration = this.events.on(this.mitmSocket, 'close', () => {
            this.isClosing = true;
            if (this.onClose)
                this.onClose();
        });
        this.events.on(this.mitmSocket, 'eof', async () => {
            this.events.off(onCloseRegistration);
            if (this.isClosing)
                return;
            this.mitmSocket.close();
            try {
                this.isConnected = this.connect();
                await this.isConnected;
                // re-run pending queries
                for (const [id, entry] of this.pending) {
                    this.pending.delete(id);
                    const newHost = this.getDnsResponse(entry.host);
                    entry.resolvable.resolve(newHost);
                }
            }
            catch (error) {
                this.logger.info('Error re-connecting to dns', {
                    error,
                });
            }
        });
    }
    getDnsResponse(host) {
        const id = this.query({
            name: host,
            class: 'IN',
            type: 'A',
        });
        const resolvable = (0, utils_1.createPromise)(5e3);
        this.pending.set(id, { host, resolvable });
        return resolvable.promise;
    }
    disconnect() {
        for (const [, entry] of this.pending) {
            entry.resolvable.reject(new IPendingWaitEvent_1.CanceledPromiseError('Disconnecting Dns Socket'), true);
        }
        this.close();
    }
    query(...questions) {
        const id = (0, crypto_1.randomBytes)(2).readUInt16BE(0);
        const dnsQuery = dnsPacket.streamEncode({
            flags: dnsPacket.RECURSION_DESIRED,
            id,
            questions,
            type: 'query',
        });
        this.mitmSocket.socket.write(dnsQuery);
        return id;
    }
    onData(data) {
        if (this.buffer === null) {
            this.buffer = Buffer.from(data);
        }
        else {
            this.buffer = Buffer.concat([this.buffer, data]);
        }
        while (this.buffer.byteLength > 2) {
            const messageLength = this.getMessageLength();
            if (messageLength < 12) {
                return this.disconnect();
            }
            if (this.buffer.byteLength < messageLength + 2)
                return;
            // append prefixed byte length
            const next = this.buffer.slice(0, messageLength + 2);
            const decoded = dnsPacket.streamDecode(next);
            this.pending.get(decoded.id)?.resolvable?.resolve(decoded);
            this.pending.delete(decoded.id);
            this.buffer = this.buffer.slice(messageLength + 2);
        }
    }
    getMessageLength() {
        if (this.buffer.byteLength >= 2) {
            // https://tools.ietf.org/html/rfc7858#section-3.3
            // https://tools.ietf.org/html/rfc1035#section-4.2.2
            // The message is prefixed with a two byte length field which gives the
            // message length, excluding the two byte length field.
            return this.buffer.readUInt16BE(0);
        }
    }
}
exports.default = DnsOverTlsSocket;
//# sourceMappingURL=DnsOverTlsSocket.js.map