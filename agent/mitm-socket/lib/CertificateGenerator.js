"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const BaseIpcHandler_1 = require("./BaseIpcHandler");
const { log } = (0, Logger_1.default)(module);
let certRequestId = 0;
class CertificateGenerator extends BaseIpcHandler_1.default {
    constructor(options = {}) {
        super({ ...options, mode: 'certs' });
        this.logger = log.createChild(module);
        this.pendingCertsById = new Map();
        this.waitForInit = new Resolvable_1.default();
        this.hasWaitForInitListeners = false;
        this.store = options.store;
    }
    async getCertificate(host) {
        if (this.isClosing)
            return { key: null, cert: null };
        await this.waitForConnected;
        const existing = this.store?.get(host);
        if (existing) {
            return { cert: existing.pem, key: existing.key };
        }
        // if it doesn't exist, generate now
        const { expireDate, cert, key } = await this.generateCerts(host);
        this.store?.save({ host, pem: cert, expireDate, key });
        return { key, cert };
    }
    close() {
        super.close();
        for (const pending of this.pendingCertsById.values())
            pending.reject(new IPendingWaitEvent_1.CanceledPromiseError('Closing Certificate Generator'), true);
    }
    async generateCerts(host) {
        await this.waitForConnected;
        certRequestId += 1;
        const id = certRequestId;
        const resolvable = new Resolvable_1.default(10e3);
        this.pendingCertsById.set(id, resolvable);
        try {
            await this.waitForInit;
            await this.sendIpcMessage({ id, host });
        }
        catch (error) {
            if (this.isClosing)
                return;
            throw error;
        }
        this.hasWaitForInitListeners = true;
        const { cert, expireDate } = await resolvable.promise;
        return { cert: Buffer.from(cert), expireDate, key: this.privateKey };
    }
    onMessage(rawMessage) {
        if (this.isClosing)
            return;
        const message = JSON.parse(rawMessage);
        if (this.options.debug) {
            const toLog = { ...message };
            if (message.status === 'init') {
                toLog.privateKey = `-----BEGIN RSA PRIVATE KEY-----\n...key used by man-in-the-middle removed for logs...\n-----END RSA PRIVATE KEY-----\n`;
            }
            this.logger.info('CertificateGenerator.onMessage', {
                ...toLog,
            });
        }
        if (message.status === 'init') {
            this.privateKey = Buffer.from(message.privateKey);
            this.waitForInit.resolve();
            return;
        }
        if (!message.id) {
            this.logger.warn('CertificateGenerator.unprocessableMessage', {
                message,
            });
            return;
        }
        const pending = this.pendingCertsById.get(message.id);
        if (!pending) {
            this.logger.warn('CertificateGenerator.unprocessableMessage:notFound', {
                message,
            });
            return;
        }
        this.pendingCertsById.delete(message.id);
        if (message.status === 'error') {
            pending.reject(new Error(message.error));
        }
        else if (message.status === 'certs') {
            pending.resolve({ cert: message.cert, expireDate: message.expireDate * 1e3 });
        }
    }
    beforeExit() {
        for (const cert of this.pendingCertsById.values()) {
            cert.reject(new IPendingWaitEvent_1.CanceledPromiseError('Canceling certificate generation'), true);
        }
        if (this.hasWaitForInitListeners && this.waitForInit && !this.waitForInit.isResolved) {
            this.waitForInit.reject(new IPendingWaitEvent_1.CanceledPromiseError('Canceling ipc initialization'), true);
        }
    }
}
exports.default = CertificateGenerator;
//# sourceMappingURL=CertificateGenerator.js.map