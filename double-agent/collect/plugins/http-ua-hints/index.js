"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const fs = require("fs");
const DomainUtils_1 = require("@double-agent/collect/lib/DomainUtils");
const index_1 = require("@double-agent/config/index");
const uaPageScript_1 = require("./uaPageScript");
const img = fs.readFileSync(`${__dirname}/public/img.png`);
class HttpUaHintsPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('https', '/', this.loadScript);
        this.registerRoute('https', '/iframe', this.saveAndLoadScript);
        this.registerRoute('http2', '/', this.saveAndLoadScript);
        this.registerRoute('http2', '/iframe', this.saveAndLoadScript);
        this.registerRoute('all', '/style.css', this.loadCss, this.savePreflightHeaders);
        this.registerRoute('all', '/img.png', this.loadImage, this.savePreflightHeaders);
        this.registerRoute('all', '/save', this.save, this.savePreflightHeaders);
        const { MainDomain } = index_1.default.collect.domains;
        this.registerPages({
            route: this.routes.https['/'],
            domain: MainDomain,
            waitForReady: true,
        }, {
            route: this.routes.http2['/'],
            domain: MainDomain,
            waitForReady: true,
        });
    }
    loadCss(ctx) {
        saveHeadersToProfile(this, ctx);
        // test that you can't do accept-ch from a stylesheet - needs to be a document
        ctx.res.setHeader('Accept-CH', HttpUaHintsPlugin.uaHintOptions.join(','));
        ctx.res.setHeader('critical-ch', HttpUaHintsPlugin.uaHintOptions.join(','));
        ctx.res.setHeader('content-type', 'text/css');
        ctx.res.end('');
    }
    loadImage(ctx) {
        saveHeadersToProfile(this, ctx);
        ctx.res.setHeader('content-type', 'image/png');
        ctx.res.end(img);
    }
    saveAndLoadScript(ctx) {
        saveHeadersToProfile(this, ctx);
        this.loadScript(ctx);
    }
    savePreflightHeaders(ctx) {
        saveHeadersToProfile(this, ctx);
    }
    loadScript(ctx) {
        const document = new Document_1.default(ctx);
        ctx.res.setHeader('Accept-CH', HttpUaHintsPlugin.uaHintOptions.join(','));
        ctx.res.setHeader('critical-ch', HttpUaHintsPlugin.uaHintOptions.join(','));
        for (const domain of [DomainUtils_1.DomainType.MainDomain, DomainUtils_1.DomainType.SubDomain, DomainUtils_1.DomainType.CrossDomain]) {
            document.injectHeadTag(`<link rel='stylesheet' type='text/css' href='${ctx.buildUrl('/style.css', domain)}' />`);
            document.injectBodyTag(`<img src='${ctx.buildUrl('/img.png', domain)}' alt='test' />`);
        }
        // TEST out what a "third party" domain does.
        if (ctx.requestDetails.domainType === DomainUtils_1.DomainType.MainDomain) {
            document.injectBodyTag(`<iframe src='${ctx.buildUrl('/iframe', DomainUtils_1.DomainType.CrossDomain)}'></iframe>`);
        }
        document.injectBodyTag((0, uaPageScript_1.default)(ctx));
        ctx.res.end(document.html);
    }
    async save(ctx) {
        const profileData = saveHeadersToProfile(this, ctx);
        profileData.jsHighEntropyHints = ctx.requestDetails.bodyJson;
        profileData.testedHeaders = HttpUaHintsPlugin.uaHintOptions;
        ctx.session.savePluginProfileData(this, profileData, {
            keepInMemory: true,
        });
        ctx.res.end();
    }
}
// TODO: as this list changes, the header order changes too. To truly replicate, we would need to do all combinations
// NOTE: order of ua-hints does not have an impact in returned order (if they're the same)
HttpUaHintsPlugin.uaHintOptions = [
    'sec-ch-ua',
    'ua',
    'sec-ch-ua-platform',
    'ua-platform',
    'sec-ch-ua-mobile',
    'ua-mobile',
    'sec-ch-ua-full-version',
    'ua-full-version',
    'sec-ch-ua-full-version-list',
    'sec-ch-ua-platform-version',
    'ua-platform-version',
    'sec-ch-ua-arch',
    'ua-arch',
    'sec-ch-ua-bitness',
    'ua-bitness',
    'sec-ch-ua-wow64',
    'sec-ch-ua-model',
    'ua-model',
    'sec-ch-lang',
    'lang',
    'sec-ch-save-data',
    'save-data',
    'sec-ch-width',
    'width',
    'sec-ch-viewport-width',
    'viewport-width',
    'sec-ch-viewport-height',
    'viewport-height',
    'sec-ch-dpr',
    'dpr',
    'sec-ch-device-memory',
    'device-memory',
    'sec-ch-rtt',
    'rtt',
    'sec-ch-downlink',
    'downlink',
    'sec-ch-ect',
    'ect',
    'sec-ch-prefers-color-scheme',
    'sec-ch-prefers-reduced-motion',
    'sec-ch-prefers-reduced-transparency',
    'sec-ch-prefers-contrast',
    'sec-ch-forced-colors',
];
exports.default = HttpUaHintsPlugin;
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
    const profileData = ctx.session.getPluginProfileData(plugin, {
        headers: [],
    });
    profileData.headers.push({
        pageName,
        method,
        protocol,
        isRedirect: false,
        domainType,
        originType,
        resourceType,
        pathname,
        referer,
        rawHeaders,
    });
    ctx.session.savePluginProfileData(plugin, profileData, { keepInMemory: true });
    return profileData;
}
//# sourceMappingURL=index.js.map