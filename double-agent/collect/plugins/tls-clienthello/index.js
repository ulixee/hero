"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
class TlsClienthelloPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('tls', '/', this.save);
        this.registerPages({ route: this.routes.tls['/'] });
    }
    async save(ctx) {
        const profileData = {
            clientHello: ctx.req.clientHello,
        };
        ctx.session.savePluginProfileData(this, profileData);
        ctx.res.end('Done');
    }
}
exports.default = TlsClienthelloPlugin;
//# sourceMappingURL=index.js.map