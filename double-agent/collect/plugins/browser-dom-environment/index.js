"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PromiseUtils_1 = require("@double-agent/collect/lib/PromiseUtils");
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const DomainUtils_1 = require("@double-agent/collect/lib/DomainUtils");
const PageNames_1 = require("./interfaces/PageNames");
const iframeScripts_1 = require("./lib/iframeScripts");
const serviceWorkerScripts_1 = require("./lib/serviceWorkerScripts");
const sharedWorkerScripts_1 = require("./lib/sharedWorkerScripts");
const dedicatedWorkerScripts_1 = require("./lib/dedicatedWorkerScripts");
const loadDomExtractorScript_1 = require("./lib/loadDomExtractorScript");
class BrowserDomPlugin extends Plugin_1.default {
    constructor() {
        super(...arguments);
        this.outputFiles = 2; // TODO: update to include workers as they are output
        this.pendingByKey = {};
    }
    initialize() {
        this.registerRoute('allHttp1', '/', this.loadScript);
        this.registerRoute('allHttp1', '/save', this.save);
        this.registerRoute('allHttp1', '/dom-extractor-stall', this.handleStallLog);
        this.registerRoute('allHttp1', '/load-dedicated-worker', this.loadDedicatedWorker);
        this.registerRoute('allHttp1', '/dedicated-worker.js', dedicatedWorkerScripts_1.dedicatedWorkerScript);
        this.registerRoute('allHttp1', '/load-service-worker', this.loadServiceWorker);
        this.registerRoute('allHttp1', '/service-worker.js', serviceWorkerScripts_1.serviceWorkerScript);
        this.registerRoute('allHttp1', '/load-shared-worker', this.loadSharedWorker);
        this.registerRoute('allHttp1', '/shared-worker.js', sharedWorkerScripts_1.sharedWorkerScript);
        this.registerRoute('allHttp1', '/load-iframe', this.loadIFrame);
        this.registerRoute('allHttp1', '/load-iframe-sandbox', this.loadIFrameSandbox);
        this.registerRoute('allHttp1', '/load-iframe-cross-domain', this.loadIFrameCrossDomain);
        this.registerRoute('allHttp1', '/iframe', iframeScripts_1.iframePage);
        this.registerRoute('allHttp1', '/wait-until-finished', this.waitUntilFinished);
        this.registerRoute('allHttp1', '/wait-until-finished.js', this.waitUntilFinishedJs);
        const pages = [];
        ['http', 'https'].forEach(protocol => {
            pages.push({ route: this.routes[protocol]['/'], waitForReady: true, name: PageNames_1.default.BrowserDom });
        });
        this.registerPages(...pages);
    }
    loadScript(ctx) {
        const document = new Document_1.default(ctx);
        const pageMeta = {
            saveToUrl: ctx.buildUrl('/save'),
            pageUrl: ctx.url.href,
            pageHost: ctx.url.host,
            pageName: PageNames_1.default.BrowserDom,
            debugToConsole: process.env.DOM_CONSOLE === '1',
            stallLogUrl: ctx.buildUrl('/dom-extractor-stall'),
        };
        document.injectBodyTag(`
      <script type="text/javascript">
        ${(0, loadDomExtractorScript_1.default)()};
        window.pageQueue.push(new DomExtractor('window', ${JSON.stringify(pageMeta)}).runAndSave());
      </script>
    `);
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    loadServiceWorker(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag(`${(0, serviceWorkerScripts_1.loadServiceWorker)(ctx)}`);
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    loadDedicatedWorker(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag(`${(0, dedicatedWorkerScripts_1.loadDedicatedWorker)(ctx)}`);
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    loadSharedWorker(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag(`${(0, sharedWorkerScripts_1.loadSharedWorker)(ctx)}`);
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    loadIFrame(ctx) {
        const document = new Document_1.default(ctx);
        const testPath = `/iframe?page-name=${PageNames_1.default.IFrameDom}`;
        document.injectBodyTag(`<iframe src='${ctx.buildUrl(testPath)}'></iframe>`);
        document.injectBodyTag((0, iframeScripts_1.waitForIframe)());
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    loadIFrameSandbox(ctx) {
        const document = new Document_1.default(ctx);
        const testPath = `/iframe?page-name=${PageNames_1.default.IFrameSandboxDom}`;
        document.injectBodyTag(`<iframe src='${ctx.buildUrl(testPath)}' sandbox="allow-scripts allow-same-origin"></iframe>`);
        document.injectBodyTag((0, iframeScripts_1.waitForIframe)());
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    loadIFrameCrossDomain(ctx) {
        const document = new Document_1.default(ctx);
        const testPath = `/iframe?page-name=${PageNames_1.default.IFrameCrossDomainDom}`;
        document.injectBodyTag(`<iframe src='${ctx.buildUrl(testPath, DomainUtils_1.DomainType.CrossDomain)}' sandbox="allow-scripts"></iframe>`);
        document.injectBodyTag((0, iframeScripts_1.waitForIframe)());
        this.addWaitIfNeeded(document, ctx);
        ctx.res.end(document.html);
    }
    async save(ctx) {
        const pageName = ctx.req.headers['page-name'] || PageNames_1.default.BrowserDom;
        const pendingKey = this.getPendingKey(ctx, pageName);
        let filenameSuffix = ctx.url.protocol.replace(':', '');
        if (pageName === PageNames_1.default.ServiceWorkerDom) {
            filenameSuffix += '-service-worker';
        }
        else if (pageName === PageNames_1.default.SharedWorkerDom) {
            filenameSuffix += '-shared-worker';
        }
        else if (pageName === PageNames_1.default.DedicatedWorkerDom) {
            filenameSuffix += '-dedicated-worker';
        }
        else if (pageName === PageNames_1.default.IFrameDom) {
            filenameSuffix += '-iframe';
        }
        else if (pageName === PageNames_1.default.IFrameSandboxDom) {
            filenameSuffix += '-iframe-sandbox';
        }
        else if (pageName === PageNames_1.default.IFrameCrossDomainDom) {
            filenameSuffix += '-iframe-cross-domain';
        }
        const profileData = ctx.requestDetails.bodyJson;
        ctx.session.savePluginProfileData(this, profileData, { filenameSuffix });
        this.pendingByKey[pendingKey]?.resolve();
        ctx.res.end();
    }
    async handleStallLog(ctx) {
        const pageName = ctx.req.headers['page-name'] || PageNames_1.default.BrowserDom;
        const pendingKey = this.getPendingKey(ctx, pageName);
        const body = ctx.requestDetails.bodyJson;
        const path = body?.path ? String(body.path) : '';
        if (path) {
            console.warn('[dom-extractor-stall]', pendingKey, ctx.url.href, path);
        }
        else {
            console.warn('[dom-extractor-stall]', pendingKey, ctx.url.href);
        }
        ctx.res.end();
    }
    async waitUntilFinished(ctx) {
        const pendingKey = this.getPendingKey(ctx, ctx.url.searchParams.get('pageName') || PageNames_1.default.BrowserDom);
        this.pendingByKey[pendingKey] = (0, PromiseUtils_1.createPromise)();
        await this.pendingByKey[pendingKey].promise;
        ctx.res.end();
    }
    async waitUntilFinishedJs(ctx) {
        const pendingKey = ctx.url.searchParams.get('pendingKey');
        await this.pendingByKey[pendingKey]?.promise;
        delete this.pendingByKey[pendingKey];
        ctx.res.writeHead(200, { 'Content-Type': 'application/javascript' });
        ctx.res.end('');
    }
    addWaitIfNeeded(document, ctx) {
        const pendingKey = this.getPendingKey(ctx, ctx.page.name);
        if (this.pendingByKey[pendingKey]) {
            document.injectFooterTag(`<script src="${ctx.buildUrl(`/wait-until-finished.js?pendingKey=${pendingKey}`)}"></script>`);
        }
    }
    getPendingKey(ctx, pageName) {
        return `${ctx.session.id}:${ctx.url.protocol}:${pageName}`;
    }
}
exports.default = BrowserDomPlugin;
//# sourceMappingURL=index.js.map