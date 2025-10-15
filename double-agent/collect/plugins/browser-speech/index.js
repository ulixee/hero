"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const script_1 = require("./script");
class BrowserSpeechPlugin extends Plugin_1.default {
    initialize() {
        for (const protocol of ['http', 'https']) {
            this.registerRoute(protocol, '/', this.loadScript);
            this.registerRoute(protocol, '/save', this.save);
            this.registerPages({
                route: this.routes[protocol]['/'],
                waitForReady: true,
            });
        }
    }
    loadScript(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag((0, script_1.default)(ctx));
        ctx.res.end(document.html);
    }
    async save(ctx) {
        // TODO: voices don't always work on browserstack. can't figure out why
        const voices = ctx.requestDetails.bodyJson ?? [];
        const profile = ctx.session.getPluginProfileData(this, {});
        profile[ctx.server.protocol] = voices;
        ctx.session.savePluginProfileData(this, profile);
        ctx.res.setHeader('content-type', 'text/plain');
        ctx.res.end('ok');
    }
}
exports.default = BrowserSpeechPlugin;
//# sourceMappingURL=index.js.map