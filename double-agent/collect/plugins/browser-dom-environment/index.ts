import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import { createPromise, IResolvablePromise } from '@double-agent/collect/lib/PromiseUtils';
import Plugin, { IPluginPage } from '@double-agent/collect/lib/Plugin';
import Document from '@double-agent/collect/lib/Document';
import { DomainType } from '@double-agent/collect/lib/DomainUtils';
import { IProfileData } from './interfaces/IProfile';
import PageNames from './interfaces/PageNames';
import { iframePage, waitForIframe } from './lib/iframeScripts';
import { loadServiceWorker, serviceWorkerScript } from './lib/serviceWorkerScripts';
import { loadSharedWorker, sharedWorkerScript } from './lib/sharedWorkerScripts';
import { dedicatedWorkerScript, loadDedicatedWorker } from './lib/dedicatedWorkerScripts';
import loadDomExtractorScript, { IDomExtractorPageMeta } from './lib/loadDomExtractorScript';

export default class BrowserDomPlugin extends Plugin {
  public override outputFiles = 2; // TODO: update to include workers as they are output
  private pendingByKey: { [key: string]: IResolvablePromise } = {};

  public initialize() {
    this.registerRoute('allHttp1', '/', this.loadScript);
    this.registerRoute('allHttp1', '/save', this.save);
    this.registerRoute('allHttp1', '/dom-extractor-stall', this.handleStallLog);
    this.registerRoute('allHttp1', '/load-dedicated-worker', this.loadDedicatedWorker);
    this.registerRoute('allHttp1', '/dedicated-worker.js', dedicatedWorkerScript);
    this.registerRoute('allHttp1', '/load-service-worker', this.loadServiceWorker);
    this.registerRoute('allHttp1', '/service-worker.js', serviceWorkerScript);
    this.registerRoute('allHttp1', '/load-shared-worker', this.loadSharedWorker);
    this.registerRoute('allHttp1', '/shared-worker.js', sharedWorkerScript);
    this.registerRoute('allHttp1', '/load-iframe', this.loadIFrame);
    this.registerRoute('allHttp1', '/load-iframe-sandbox', this.loadIFrameSandbox);
    this.registerRoute('allHttp1', '/load-iframe-cross-domain', this.loadIFrameCrossDomain);
    this.registerRoute('allHttp1', '/iframe', iframePage);
    this.registerRoute('allHttp1', '/wait-until-finished', this.waitUntilFinished);
    this.registerRoute('allHttp1', '/wait-until-finished.js', this.waitUntilFinishedJs);

    const pages: IPluginPage[] = [];
    ['http', 'https'].forEach(protocol => {
      pages.push(
        { route: this.routes[protocol]['/'], waitForReady: true, name: PageNames.BrowserDom },
        // {
        //   route: this.routes[protocol]['/load-service-worker'],
        //   waitForReady: true,
        //   name: PageNames.ServiceWorkerDom,
        // },
        // {
        //   route: this.routes[protocol]['/load-shared-worker'],
        //   waitForReady: true,
        //   name: PageNames.SharedWorkerDom,
        // },
        // {
        //   route: this.routes[protocol]['/load-dedicated-worker'],
        //   waitForReady: true,
        //   name: PageNames.DedicatedWorkerDom,
        // },
        // {
        //   route: this.routes[protocol]['/load-iframe'],
        //   waitForReady: true,
        //   name: PageNames.IFrameDom,
        // },
        // {
        //   route: this.routes[protocol]['/load-iframe-sandbox'],
        //   waitForReady: true,
        //   name: PageNames.IFrameSandboxDom,
        // },
        // {
        //   route: this.routes[protocol]['/load-iframe-cross-domain'],
        //   waitForReady: true,
        //   name: PageNames.IFrameCrossDomainDom,
        // },
      );
    });
    this.registerPages(...pages);
  }

  private loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    const pageMeta: IDomExtractorPageMeta = {
      saveToUrl: ctx.buildUrl('/save'),
      pageUrl: ctx.url.href,
      pageHost: ctx.url.host,
      pageName: PageNames.BrowserDom,
      debugToConsole: process.env.DOM_CONSOLE === '1',
      stallLogUrl: ctx.buildUrl('/dom-extractor-stall'),
    };
    document.injectBodyTag(`
      <script type="text/javascript">
        ${loadDomExtractorScript()};
        window.pageQueue.push(new DomExtractor('window', ${JSON.stringify(pageMeta)}).runAndSave());
      </script>
    `);
    this.addWaitIfNeeded(document, ctx);
    ctx.res.end(document.html);
  }

  private loadServiceWorker(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(`${loadServiceWorker(ctx)}`);
    this.addWaitIfNeeded(document, ctx);
    ctx.res.end(document.html);
  }

  private loadDedicatedWorker(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(`${loadDedicatedWorker(ctx)}`);
    this.addWaitIfNeeded(document, ctx);
    ctx.res.end(document.html);
  }

  private loadSharedWorker(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(`${loadSharedWorker(ctx)}`);
    this.addWaitIfNeeded(document, ctx);

    ctx.res.end(document.html);
  }

  private loadIFrame(ctx: IRequestContext) {
    const document = new Document(ctx);
    const testPath = `/iframe?page-name=${PageNames.IFrameDom}`;
    document.injectBodyTag(`<iframe src='${ctx.buildUrl(testPath)}'></iframe>`);
    document.injectBodyTag(waitForIframe());
    this.addWaitIfNeeded(document, ctx);
    ctx.res.end(document.html);
  }

  private loadIFrameSandbox(ctx: IRequestContext) {
    const document = new Document(ctx);
    const testPath = `/iframe?page-name=${PageNames.IFrameSandboxDom}`;
    document.injectBodyTag(
      `<iframe src='${ctx.buildUrl(testPath)}' sandbox="allow-scripts allow-same-origin"></iframe>`,
    );
    document.injectBodyTag(waitForIframe());
    this.addWaitIfNeeded(document, ctx);
    ctx.res.end(document.html);
  }

  private loadIFrameCrossDomain(ctx: IRequestContext) {
    const document = new Document(ctx);
    const testPath = `/iframe?page-name=${PageNames.IFrameCrossDomainDom}`;
    document.injectBodyTag(
      `<iframe src='${ctx.buildUrl(
        testPath,
        DomainType.CrossDomain,
      )}' sandbox="allow-scripts"></iframe>`,
    );
    document.injectBodyTag(waitForIframe());
    this.addWaitIfNeeded(document, ctx);
    ctx.res.end(document.html);
  }

  private async save(ctx: IRequestContext) {
    const pageName = ctx.req.headers['page-name'] || PageNames.BrowserDom;
    const pendingKey = this.getPendingKey(ctx, pageName as string);

    let filenameSuffix = ctx.url.protocol.replace(':', '');
    if (pageName === PageNames.ServiceWorkerDom) {
      filenameSuffix += '-service-worker';
    } else if (pageName === PageNames.SharedWorkerDom) {
      filenameSuffix += '-shared-worker';
    } else if (pageName === PageNames.DedicatedWorkerDom) {
      filenameSuffix += '-dedicated-worker';
    } else if (pageName === PageNames.IFrameDom) {
      filenameSuffix += '-iframe';
    } else if (pageName === PageNames.IFrameSandboxDom) {
      filenameSuffix += '-iframe-sandbox';
    } else if (pageName === PageNames.IFrameCrossDomainDom) {
      filenameSuffix += '-iframe-cross-domain';
    }
    const profileData = ctx.requestDetails.bodyJson as IProfileData;
    ctx.session.savePluginProfileData<IProfileData>(this, profileData, { filenameSuffix });
    this.pendingByKey[pendingKey]?.resolve();
    ctx.res.end();
  }

  private async handleStallLog(ctx: IRequestContext) {
    const pageName = ctx.req.headers['page-name'] || PageNames.BrowserDom;
    const pendingKey = this.getPendingKey(ctx, pageName as string);
    const body = ctx.requestDetails.bodyJson as { path?: string; pageName?: string };
    const path = body?.path ? String(body.path) : '';
    if (path) {
      console.warn('[dom-extractor-stall]', pendingKey, ctx.url.href, path);
    } else {
      console.warn('[dom-extractor-stall]', pendingKey, ctx.url.href);
    }
    ctx.res.end();
  }

  private async waitUntilFinished(ctx: IRequestContext) {
    const pendingKey = this.getPendingKey(
      ctx,
      ctx.url.searchParams.get('pageName') || PageNames.BrowserDom,
    );
    this.pendingByKey[pendingKey] = createPromise();
    await this.pendingByKey[pendingKey].promise;
    ctx.res.end();
  }

  private async waitUntilFinishedJs(ctx: IRequestContext) {
    const pendingKey = ctx.url.searchParams.get('pendingKey');
    await this.pendingByKey[pendingKey]?.promise;
    delete this.pendingByKey[pendingKey];
    ctx.res.writeHead(200, { 'Content-Type': 'application/javascript' });
    ctx.res.end('');
  }

  private addWaitIfNeeded(document: Document, ctx: IRequestContext) {
    const pendingKey = this.getPendingKey(ctx, ctx.page.name);
    if (this.pendingByKey[pendingKey]) {
      document.injectFooterTag(
        `<script src="${ctx.buildUrl(
          `/wait-until-finished.js?pendingKey=${pendingKey}`,
        )}"></script>`,
      );
    }
  }

  private getPendingKey(ctx: IRequestContext, pageName: string) {
    return `${ctx.session.id}:${ctx.url.protocol}:${pageName}`;
  }
}
