"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const fontScript_1 = require("./fontScript");
class BrowserFontsPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('https', '/', this.loadScript);
        this.registerRoute('https', '/save', this.save);
        this.registerPages({ route: this.routes.https['/'], waitForReady: true });
    }
    async loadScript(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag((0, fontScript_1.default)(ctx));
        ctx.res.end(document.html);
    }
    async save(ctx) {
        const profileData = ctx.requestDetails.bodyJson;
        ctx.session.savePluginProfileData(this, profileData);
        ctx.res.end();
    }
}
exports.default = BrowserFontsPlugin;
//# sourceMappingURL=index.js.map