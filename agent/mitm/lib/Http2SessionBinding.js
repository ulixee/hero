"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
class Http2SessionBinding {
    constructor(clientSession, serverSession, events, logger, logData) {
        this.clientSession = clientSession;
        this.serverSession = serverSession;
        this.events = events;
        this.logger = logger.createChild(module, logData);
        (0, utils_1.bindFunctions)(this);
        this.bind();
    }
    bind() {
        const clientSession = this.clientSession;
        const serverSession = this.serverSession;
        if (clientSession)
            this.events.on(clientSession, 'ping', this.pingServer);
        this.events.on(serverSession, 'error', this.onServerError);
        this.events.on(serverSession, 'close', this.onServerClose);
        this.events.on(serverSession, 'goaway', this.onServerGoaway);
        this.events.on(serverSession, 'remoteSettings', remoteSettings => {
            this.logger.stats('Http2Client.remoteSettings', {
                remoteSettings,
            });
        });
        this.events.on(serverSession, 'frameError', (frameType, errorCode) => {
            this.logger.warn('Http2Client.frameError', {
                frameType,
                errorCode,
            });
        });
        this.events.on(serverSession, 'altsvc', (alt, altOrigin) => {
            this.logger.stats('Http2.altsvc', {
                altOrigin,
                alt,
            });
        });
        this.events.on(serverSession, 'origin', origins => {
            this.logger.stats('Http2.origin', {
                origins,
            });
        });
    }
    pingServer(bytes) {
        if (this.serverSession.destroyed)
            return;
        this.serverSession.ping(bytes, () => null);
    }
    onServerClose() {
        this.logger.info('Http2Client.close');
        if (!this.clientSession || this.clientSession.destroyed)
            return;
        this.clientSession.close();
    }
    onServerError(error) {
        this.logger.warn('Http2Client.error', {
            error,
        });
        if (!this.clientSession || this.clientSession.destroyed)
            return;
        this.clientSession.destroy(error);
    }
    onServerGoaway(code, lastStreamID, opaqueData) {
        this.logger.stats('Http2.goaway', {
            code,
            lastStreamID,
            opaqueData: opaqueData ? Buffer.from(opaqueData.buffer).toString() : undefined,
        });
        if (!this.clientSession || this.clientSession.destroyed)
            return;
        this.clientSession.goaway(code);
    }
}
exports.default = Http2SessionBinding;
//# sourceMappingURL=Http2SessionBinding.js.map