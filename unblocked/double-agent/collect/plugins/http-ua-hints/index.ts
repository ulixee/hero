import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Document from '@double-agent/collect/lib/Document';
import * as fs from 'fs';
import { DomainType } from '@double-agent/collect/lib/DomainUtils';
import Config from '@double-agent/config/index';
import { IProfileData } from './interfaces/IProfile';
import uaPageScript from './uaPageScript';

const img = fs.readFileSync(`${__dirname}/public/img.png`);

export default class HttpUaHintsPlugin extends Plugin {
  // TODO: as this list changes, the header order changes too. To truly replicate, we would need to do all combinations
  // NOTE: order of ua-hints does not have an impact in returned order (if they're the same)
  public static uaHintOptions = [
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

  public initialize(): void {
    this.registerRoute('https', '/', this.loadScript);
    this.registerRoute('https', '/iframe', this.saveAndLoadScript);
    this.registerRoute('http2', '/', this.saveAndLoadScript);
    this.registerRoute('http2', '/iframe', this.saveAndLoadScript);
    this.registerRoute('all', '/style.css', this.loadCss, this.savePreflightHeaders);
    this.registerRoute('all', '/img.png', this.loadImage, this.savePreflightHeaders);
    this.registerRoute('all', '/save', this.save, this.savePreflightHeaders);

    const { MainDomain } = Config.collect.domains;
    this.registerPages(
      {
        route: this.routes.https['/'],
        domain: MainDomain,
        waitForReady: true,
      },
      {
        route: this.routes.http2['/'],
        domain: MainDomain,
        waitForReady: true,
      },
    );
  }

  private loadCss(ctx: IRequestContext): void {
    saveHeadersToProfile(this, ctx);
    // test that you can't do accept-ch from a stylesheet - needs to be a document
    ctx.res.setHeader('Accept-CH', HttpUaHintsPlugin.uaHintOptions.join(','));
    ctx.res.setHeader('critical-ch', HttpUaHintsPlugin.uaHintOptions.join(','));
    ctx.res.setHeader('content-type', 'text/css');
    ctx.res.end('');
  }

  private loadImage(ctx: IRequestContext): void {
    saveHeadersToProfile(this, ctx);
    ctx.res.setHeader('content-type', 'image/png');
    ctx.res.end(img);
  }

  private saveAndLoadScript(ctx: IRequestContext): void {
    saveHeadersToProfile(this, ctx);
    this.loadScript(ctx);
  }

  private savePreflightHeaders(ctx: IRequestContext): void {
    saveHeadersToProfile(this, ctx);
  }

  private loadScript(ctx: IRequestContext): void {
    const document = new Document(ctx);
    ctx.res.setHeader('Accept-CH', HttpUaHintsPlugin.uaHintOptions.join(','));
    ctx.res.setHeader('critical-ch', HttpUaHintsPlugin.uaHintOptions.join(','));
    for (const domain of [DomainType.MainDomain, DomainType.SubDomain, DomainType.CrossDomain]) {
      document.injectHeadTag(
        `<link rel='stylesheet' type='text/css' href='${ctx.buildUrl('/style.css', domain)}' />`,
      );
      document.injectBodyTag(`<img src='${ctx.buildUrl('/img.png', domain)}' alt='test' />`);
    }
    // TEST out what a "third party" domain does.
    if (ctx.requestDetails.domainType === DomainType.MainDomain) {
      document.injectBodyTag(
        `<iframe src='${ctx.buildUrl('/iframe', DomainType.CrossDomain)}'></iframe>`,
      );
    }
    document.injectBodyTag(uaPageScript(ctx));
    ctx.res.end(document.html);
  }

  private async save(ctx: IRequestContext): Promise<void> {
    const profileData = saveHeadersToProfile(this, ctx);
    profileData.jsHighEntropyHints = ctx.requestDetails.bodyJson;
    profileData.testedHeaders = HttpUaHintsPlugin.uaHintOptions;

    ctx.session.savePluginProfileData<IProfileData>(this, profileData, {
      keepInMemory: true,
    });
    ctx.res.end();
  }
}

function saveHeadersToProfile(plugin: Plugin, ctx: IRequestContext): IProfileData {
  const pathname = ctx.url.pathname;
  const { domainType, originType, method, referer, resourceType } = ctx.requestDetails;
  const protocol = ctx.server.protocol;
  const pageName = undefined;
  const rawHeaders: string[][] = [];
  for (let i = 0; i < ctx.req.rawHeaders.length; i += 2) {
    const key = ctx.req.rawHeaders[i];
    const value = ctx.req.rawHeaders[i + 1];
    rawHeaders.push([key, value]);
  }

  const profileData = ctx.session.getPluginProfileData<IProfileData>(plugin, {
    headers: [],
  } as any);
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
  ctx.session.savePluginProfileData<IProfileData>(plugin, profileData, { keepInMemory: true });
  return profileData;
}
