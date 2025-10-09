"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const ResourceType_1 = require("@double-agent/collect/interfaces/ResourceType");
const websocketsScript_1 = require("./websocketsScript");
class HttpHeadersPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('allHttp1', '/', this.start);
        this.registerRoute('ws', '/ws', this.onConnection);
        const pages = [];
        ['http', 'https'].forEach(protocol => {
            pages.push({ route: this.routes[protocol]['/'], waitForReady: true });
        });
        this.registerPages(...pages);
    }
    start(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag((0, websocketsScript_1.default)(ctx));
        ctx.res.end(document.html);
    }
    onConnection(ctx) {
        saveHeadersToProfile(this, ctx);
    }
}
exports.default = HttpHeadersPlugin;
/////// /////////////////
function saveHeadersToProfile(plugin, ctx) {
    const pathname = ctx.url.pathname;
    const { domainType, originType, method, referer } = ctx.requestDetails;
    const protocol = ctx.server.protocol;
    const pageName = undefined;
    const rawHeaders = [];
    for (let i = 0; i < ctx.req.rawHeaders.length; i += 2) {
        const key = ctx.req.rawHeaders[i];
        const value = ctx.req.rawHeaders[i + 1];
        rawHeaders.push([key, value]);
    }
    const profileData = ctx.session.getPluginProfileData(plugin, []);
    profileData.push({
        pageName,
        method,
        protocol,
        domainType,
        isRedirect: ctx.page?.isRedirect ?? false,
        resourceType: ResourceType_1.default.WebsocketUpgrade,
        originType,
        pathname,
        referer,
        rawHeaders,
    });
    ctx.session.savePluginProfileData(plugin, profileData, {
        keepInMemory: true,
    });
}
//# sourceMappingURL=index.js.map