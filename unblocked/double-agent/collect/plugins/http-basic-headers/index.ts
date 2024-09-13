import Plugin, { IPluginPage } from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Document from '@double-agent/collect/lib/Document';
import ResourceType from '@double-agent/collect/interfaces/ResourceType';
import Config from '@double-agent/config/index';
import { IProfileData } from './interfaces/IProfile';

const { MainDomain, CrossDomain, SubDomain } = Config.collect.domains;

export default class HttpHeadersPlugin extends Plugin {
  public initialize() {
    this.registerRoute('all', '/start', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page1', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page2', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page3', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/linkToNext', this.linkToNextPage);
    this.registerRoute('all', '/useJsToLoadNextPage', this.saveAndUseJsToLoadNextPage);
    this.registerRoute('all', '/redirectToNextPage', this.saveAndRedirectToNextPage);
    this.registerRoute('all', '/setCookies1', this.saveSetCookiesAndLinkToNextPage);
    this.registerRoute('all', '/setCookies2', this.saveSetCookiesAndLinkToNextPage);
    this.registerRoute('all', '/setCookies3', this.saveSetCookiesAndLinkToNextPage);
    this.registerRoute('all', '/page1CookieSameOrigin', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page1Cookie', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page2Cookie', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page3Cookie', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/page1PostSameOrigin', this.saveAndPostToNextPage);
    this.registerRoute('all', '/page1Post', this.saveAndPostToNextPage);
    this.registerRoute('all', '/page2Post', this.saveAndPostToNextPage);
    this.registerRoute('all', '/page3Post', this.saveAndLinkToNextPage);
    this.registerRoute('all', '/cleanCookies', this.cleanCookiesAndLinkToNextPage);

    const pages: IPluginPage[] = [];

    ['http', 'https', 'http2'].forEach((protocol) => {
      pages.push(
        {
          route: this.routes[protocol]['/start'],
          domain: MainDomain,
          clickNext: true,
          name: 'LoadedDirect',
        },
        { route: this.routes[protocol]['/linkToNext'], domain: CrossDomain, clickNext: true },
        {
          route: this.routes[protocol]['/page1'],
          domain: MainDomain,
          clickNext: true,
          name: 'ClickedFromCrossDomain',
        },
        {
          route: this.routes[protocol]['/useJsToLoadNextPage'],
          domain: SubDomain,
          waitForReady: true,
          name: 'JsLocationFromSameDomain',
        },
        {
          route: this.routes[protocol]['/page2'],
          domain: MainDomain,
          clickNext: true,
          name: 'ClickRedirectFromSameDomain',
        },
        {
          route: this.routes[protocol]['/redirectToNextPage'],
          domain: MainDomain,
          isRedirect: true,
        },
        {
          route: this.routes[protocol]['/page3'],
          domain: MainDomain,
          clickNext: true,
          name: 'RedirectedFromSameDomain',
        },
        {
          route: this.routes[protocol]['/page2'],
          domain: MainDomain,
          clickNext: true,
          name: 'LoadedSamePageAgain',
        },
        {
          route: this.routes[protocol]['/setCookies1'],
          domain: MainDomain,
          clickNext: true,
          name: 'SetCookiesMainDomain',
        },
        {
          route: this.routes[protocol]['/setCookies2'],
          domain: SubDomain,
          clickNext: true,
          name: 'SetCookiesSubDomain',
        },
        {
          route: this.routes[protocol]['/setCookies3'],
          domain: CrossDomain,
          clickNext: true,
          name: 'SetCookiesCrossDomain',
        },
        {
          route: this.routes[protocol]['/page1CookieSameOrigin'],
          domain: MainDomain,
          clickNext: true,
          name: 'CookieClickedFromSameOrigin',
        },
        {
          route: this.routes[protocol]['/page1Cookie'],
          domain: MainDomain,
          clickNext: true,
          name: 'CookieClickedFromSameDomain',
        },
        {
          route: this.routes[protocol]['/page2Cookie'],
          domain: SubDomain,
          clickNext: true,
          name: 'CookieClickedFromSubDomain',
        },
        {
          route: this.routes[protocol]['/page3Cookie'],
          domain: CrossDomain,
          waitForReady: true,
          name: 'CookieClickedFromCrossDomain',
        },
        {
          route: this.routes[protocol]['/page1PostSameOrigin'],
          domain: MainDomain,
          clickNext: true,
          name: 'ClickedToPostFromSameDomain',
        },
        {
          route: this.routes[protocol]['/page1Post'],
          domain: MainDomain,
          clickNext: true,
          name: 'PostFromSameDomain',
        },
        {
          route: this.routes[protocol]['/page2Post'],
          domain: SubDomain,
          clickNext: true,
          name: 'PostFromSubDomain',
        },
        {
          route: this.routes[protocol]['/page3Post'],
          domain: CrossDomain,
          clickNext: true,
          name: 'PostFromCrossDomain',
        },
        {
          route: this.routes[protocol]['/cleanCookies'],
          domain: MainDomain,
          clickNext: true,
        },
        {
          route: this.routes[protocol]['/cleanCookies'],
          domain: SubDomain,
          clickNext: true,
        },
        {
          route: this.routes[protocol]['/cleanCookies'],
          domain: CrossDomain,
        },
      );
    });

    this.registerPages(...pages);
  }

  public linkToNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.addNextPageClick();
    ctx.res.end(document.html);
  }

  public showGotoNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    ctx.res.end(document.html);
  }

  public saveAndLinkToNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.addNextPageClick();
    saveHeadersToProfile(this, ctx);
    ctx.res.end(document.html);
  }

  public saveAndPostToNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    // Chrome < 66 Page crashes if the form is submitted with an input/button. Workaround with link...
    document.injectBodyTag(`<form id="form" action="${ctx.nextPageLink}" method="post">
  <a href="javascript:void(0)" id="${document.clickElementId}" onclick="document.getElementById('form').submit();">Next</a>
</form>
`);
    saveHeadersToProfile(this, ctx);
    ctx.res.end(document.html);
  }

  public saveSetCookiesAndLinkToNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.addNextPageClick();
    saveHeadersToProfile(this, ctx);
    ctx.res.writeHead(200, { 'set-cookie': 'cookie1=true' });
    ctx.res.end(document.html);
  }

  public cleanCookiesAndLinkToNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.addNextPageClick();
    ctx.res.writeHead(200, { 'set-cookie': 'cookie1=true; expires=Thu, 01 Jan 1970 00:00:00 GMT' });
    ctx.res.end(document.html);
  }

  public saveAndRedirectToNextPage(ctx: IRequestContext) {
    saveHeadersToProfile(this, ctx);
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    ctx.res.end();
  }

  public saveAndUseJsToLoadNextPage(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(`<script type="text/javascript">
      (function() {
        window.afterReady = () => {
          setTimeout(() => {
            window.location.href = '${ctx.nextPageLink}';
          }, 2e3);
        }
      })();
    </script>`);
    saveHeadersToProfile(this, ctx);
    ctx.res.end(document.html);
  }
}

/////// /////////////////

function saveHeadersToProfile(
  plugin: Plugin,
  ctx: IRequestContext,
  overrideResourceType?: ResourceType,
) {
  const pathname = ctx.url.pathname;
  const { domainType, originType, method, referer, resourceType } = ctx.requestDetails;
  const protocol = ctx.server.protocol;
  const pageName = ctx.page.name;
  const isRedirect = ctx.page.isRedirect;
  const rawHeaders: string[][] = [];
  for (let i = 0; i < ctx.req.rawHeaders.length; i += 2) {
    const key = ctx.req.rawHeaders[i];
    const value = ctx.req.rawHeaders[i + 1];
    rawHeaders.push([key, value]);
  }

  const profileData = ctx.session.getPluginProfileData<IProfileData>(plugin, []);
  profileData.push({
    pageName,
    method,
    protocol,
    domainType,
    originType,
    resourceType: overrideResourceType ?? resourceType,
    isRedirect,
    pathname,
    referer,
    rawHeaders,
  });
  ctx.session.savePluginProfileData<IProfileData>(plugin, profileData, {
    keepInMemory: true,
  });
}
