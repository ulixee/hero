"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const trackRemoteTcpVars_1 = require("./lib/trackRemoteTcpVars");
class TcpPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('https', '/', this.extractData);
        this.onServerStart('https', () => {
            this.tracker = (0, trackRemoteTcpVars_1.default)(this.httpsServer.port);
            if (this.tracker.hasError) {
                console.log('------------- ERROR Starting TTL Tracker -------------\nTry starting server with sudo');
            }
        });
        this.onServerStop('https', () => {
            if (this.tracker)
                this.tracker.stop();
        });
        this.registerPages({ route: this.routes.https['/'] });
    }
    async extractData(ctx) {
        if (this.tracker.hasError) {
            ctx.res.end();
            return;
        }
        const profileData = await this.tracker.getPacket(ctx.requestDetails.remoteAddress);
        ctx.session.savePluginProfileData(this, profileData);
        const document = new Document_1.default(ctx);
        ctx.res.end(document.html);
    }
}
exports.default = TcpPlugin;
//# sourceMappingURL=index.js.map