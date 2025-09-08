"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const DomainUtils_1 = require("@double-agent/collect/lib/DomainUtils");
const contentTypeByPath = {
    '/test.js': 'application/javascript',
    '/test.css': 'text/css',
    '/test.svg': 'image/svg+xml',
    '/test.png': 'image/png',
    '/test.ttf': 'font/ttf',
    '/test.mp3': 'audio/mpeg',
    '/test.webm': 'video/webm',
    '/css-background.png': 'image/png',
};
const cachedAssetsByPath = {};
class HttpHeadersPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('all', '/', this.sendDocument);
        this.registerRoute('all', '/test.js', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/test.css', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/test.svg', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/test.png', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/test.mp3', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/test.webm', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/test.ttf', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        this.registerRoute('all', '/css-background.png', this.saveHeadersAndSendAsset, this.savePreflightHeaders);
        const pages = [];
        ['http', 'https', 'http2'].forEach((protocol) => {
            pages.push({ route: this.routes[protocol]['/'], waitForReady: true });
        });
        this.registerPages(...pages);
    }
    sendDocument(ctx) {
        const document = new Document_1.default(ctx);
        for (const domainType of [
            DomainUtils_1.DomainType.MainDomain,
            DomainUtils_1.DomainType.SubDomain,
            DomainUtils_1.DomainType.CrossDomain,
        ]) {
            document.injectHeadTag(`<script src="${ctx.buildUrl('/test.js', domainType)}"></script>`);
            document.injectHeadTag(`<link rel="stylesheet" type="text/css" href="${ctx.buildUrl('/test.css', domainType)}" />`);
            document.injectBodyTag(`<img src="${ctx.buildUrl('/test.png', domainType)}" />`);
            document.injectBodyTag(`<img src="${ctx.buildUrl('/test.svg', domainType)}" />`);
            document.injectBodyTag(`<audio controls src="${ctx.buildUrl('/test.mp3', domainType)}"></audio>`);
            document.injectBodyTag(`<video controls width="250">
    <source src="${ctx.buildUrl('/test.webm', domainType)}" type="video/webm">
</video>`);
        }
        ctx.res.end(document.html);
    }
    savePreflightHeaders(ctx) {
        saveHeadersToProfile(this, ctx);
    }
    saveHeadersAndSendAsset(ctx) {
        saveHeadersToProfile(this, ctx);
        const pathname = ctx.url.pathname.replace(`/${this.id}`, '');
        cachedAssetsByPath[pathname] ??= fs.readFileSync(`${__dirname}/public${pathname}`);
        let assetContents = cachedAssetsByPath[pathname];
        if (pathname === '/test.css') {
            const imagePath = '/css-background.png';
            const fontPath = '/test.ttf';
            assetContents = assetContents
                .toString()
                .replace(imagePath, ctx.buildUrl(imagePath, DomainUtils_1.DomainType.MainDomain))
                .replace(fontPath, ctx.buildUrl(fontPath, DomainUtils_1.DomainType.MainDomain));
        }
        ctx.res.writeHead(200, { 'Content-Type': contentTypeByPath[pathname] });
        ctx.res.end(assetContents);
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
        isRedirect: ctx.page?.isRedirect ?? false,
        domainType,
        originType,
        resourceType,
        pathname,
        referer,
        rawHeaders,
    });
    ctx.session.savePluginProfileData(plugin, profileData, { keepInMemory: true });
}
//# sourceMappingURL=index.js.map