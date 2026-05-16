"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Document_1 = require("@double-agent/collect/lib/Document");
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Path = require("path");
const xhrScript_1 = require("./xhrScript");
const axiosPath = require.resolve('axios').replace(`dist${Path.sep}node${Path.sep}axios`, `dist${Path.sep}browser${Path.sep}axios`);
const axiosJs = Fs.readFileSync(axiosPath);
const axiosSourceMap = Fs.readFileSync(`${axiosPath}.map`);
class HttpHeadersPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('all', '/run', this.run);
        this.registerAsset('all', '/axios.js', this.axiosJs);
        this.registerAsset('all', '/axios.min.map', this.axiosSourceMap);
        this.registerRoute('all', '/axios-nocustom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/axios-custom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/fetch-nocustom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/fetch-post-nocustom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/post-nocustom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/fetch-custom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/fetch-post-custom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        this.registerRoute('all', '/post-custom-headers.json', this.saveHeaders, this.savePreflightHeaders);
        const pages = [];
        ['http', 'https', 'http2'].forEach(protocol => {
            pages.push({ route: this.routes[protocol]['/run'], waitForReady: true });
        });
        this.registerPages(...pages);
    }
    run(ctx) {
        const document = new Document_1.default(ctx);
        document.injectHeadTag('<script src="/axios.js"></script>');
        document.injectBodyTag((0, xhrScript_1.default)(ctx));
        ctx.res.end(document.html);
    }
    savePreflightHeaders(ctx) {
        saveHeadersToProfile(this, ctx);
    }
    saveHeaders(ctx) {
        saveHeadersToProfile(this, ctx);
        const headers = { 'Content-Type': 'application/javascript' };
        if (ctx.req.headers.origin) {
            headers['Access-Control-Allow-Origin'] = ctx.req.headers.origin;
        }
        ctx.res.writeHead(200, headers);
        ctx.res.end('true');
    }
    axiosJs({ res }) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(axiosJs);
    }
    axiosSourceMap({ res }) {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        res.end(axiosSourceMap);
    }
}
exports.default = HttpHeadersPlugin;
/////// /////////////////
function saveHeadersToProfile(plugin, ctx) {
    const pathname = ctx.url.pathname;
    const { domainType, originType, method, referer, resourceType } = ctx.requestDetails;
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
        originType,
        resourceType,
        isRedirect: ctx.page?.isRedirect ?? false,
        pathname,
        referer,
        rawHeaders,
    });
    ctx.session.savePluginProfileData(plugin, profileData, {
        keepInMemory: true,
    });
}
//# sourceMappingURL=index.js.map