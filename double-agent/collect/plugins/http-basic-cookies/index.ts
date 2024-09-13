import * as Cookie from 'cookie';
import RealUserAgents from '@ulixee/real-user-agents';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin, { IPluginPage } from '@double-agent/collect/lib/Plugin';
import Document from '@double-agent/collect/lib/Document';
import { cleanDomains, DomainType } from '@double-agent/collect/lib/DomainUtils';
import IPlugin from '@double-agent/collect/interfaces/IPlugin';
import Config from '@double-agent/config/index';
import {
  CookieGetter,
  CookieSetter,
  ICreatedCookies,
  ICollectedCookies,
  ICookieGetter,
  ICookieSetter,
  IProfileData,
} from './interfaces/IProfile';

const { MainDomain, CrossDomain,SubDomain } = Config.collect.domains;

export default class HttpCookiesPlugin extends Plugin {
  public initialize() {
    this.registerRoute('allHttp1', '/start', this.start);
    this.registerRoute(
      'allHttp1',
      '/saveLoadAssetsAndReadFromJs',
      this.saveLoadAssetsAndReadFromJs,
    );
    this.registerRoute('allHttp1', '/saveFromJs', this.saveFromJs);
    this.registerRoute('allHttp1', '/test.css', this.saveFromCss);
    this.registerRoute('allHttp1', '/redirectToNextPage', this.redirectToNextPage);
    this.registerRoute('allHttp1', '/saveAndRedirectToNextPage', this.saveAndRedirectToNextPage);
    this.registerRoute('allHttp1', '/setAndRedirectToNextPage', this.setAndRedirectToNextPage);
    this.registerRoute('allHttp1', '/set', this.set);
    this.registerRoute('allHttp1', '/save', this.save);

    const pages: IPluginPage[] = [];

    ['http', 'https'].forEach(protocol => {
      // set cookies on server, then set cookies on client, then read cookies on client, load test.css, load subsequent page
      let data = { cookieGroup: 'SameDomain' };
      pages.push(
        { route: this.routes[protocol]['/start'], domain: MainDomain, clickNext: true, data },
        {
          route: this.routes[protocol]['/saveLoadAssetsAndReadFromJs'],
          domain: MainDomain,
          clickNext: true,
          data,
        },
        // test.css
        // saveFromJs
      );

      // try setting cookies on cross-domain during redirect
      data = { cookieGroup: 'CrossDomainRedirect' };
      pages.push(
        {
          route: this.routes[protocol]['/redirectToNextPage'],
          domain: MainDomain,
          isRedirect: true,
        },
        {
          route: this.routes[protocol]['/setAndRedirectToNextPage'],
          domain: CrossDomain,
          isRedirect: true,
          data,
        },
        {
          route: this.routes[protocol]['/saveAndRedirectToNextPage'],
          domain: MainDomain,
          isRedirect: true,
          data,
        },
      );

      // try setting cookies on sub-domain during redirect
      data = { cookieGroup: 'SubDomainRedirect' };
      pages.push(
        {
          route: this.routes[protocol]['/setAndRedirectToNextPage'],
          domain: SubDomain,
          isRedirect: true,
          data,
        },
        { route: this.routes[protocol]['/save'], domain: MainDomain, clickNext: true, data },
      );

      data = { cookieGroup: 'SubDomain' };
      pages.push(
        { route: this.routes[protocol]['/set'], domain: SubDomain, clickNext: true, data },
        { route: this.routes[protocol]['/save'], domain: MainDomain, clickNext: true, data },
      );

      data = { cookieGroup: 'CrossDomain' };
      pages.push(
        //
        { route: this.routes[protocol]['/set'], domain: CrossDomain, clickNext: true, data },
        { route: this.routes[protocol]['/save'], domain: MainDomain, data },
      );
    });

    this.registerPages(...pages);
  }

  public changePluginOrder(plugins: IPlugin[]) {
    plugins.splice(plugins.indexOf(this), 1);
    plugins.push(this);
  }

  private start(ctx: IRequestContext) {
    const document = new Document(ctx);
    const cookieGroup = ctx.page.data?.cookieGroup;
    const prefix = `${ctx.server.protocol}-${cookieGroup}`;
    const jsCookieToSet = `${prefix}--JsCookies=0`;
    const cookiesToSet = createCookies(ctx);

    document.addNextPageClick();
    document.injectBodyTag(`<script type="text/javascript">
      (function() {
        document.cookie = '${jsCookieToSet}';
      })();
    </script>`);

    ctx.res.setHeader('Set-Cookie', cookiesToSet);
    ctx.res.end(document.html);
    this.saveCreatedCookiesToProfile(cookiesToSet, ctx);
    this.saveCreatedCookiesToProfile([jsCookieToSet], ctx, { setter: 'JsScript' });
  }

  private saveLoadAssetsAndReadFromJs(ctx: IRequestContext) {
    const document = new Document(ctx);

    document.addNextPageClick();
    document.injectHeadTag(
      `<link rel="stylesheet" type="text/css" href="${ctx.buildUrl('/test.css')}" />`,
    );
    document.injectBodyTag(`<script type="text/javascript">
      (function() {
        const promise = fetch("${ctx.buildUrl('/saveFromJs')}", {
          method: 'POST',
          body: JSON.stringify({ cookies: document.cookie }),
          headers: { 'Content-Type': 'application/json' },
        });
        window.pageQueue.push(promise);
      })();
    </script>`);

    this.saveCollectedCookiesToProfile(collectCookies(ctx), ctx);
    ctx.res.end(document.html);
  }

  private saveFromJs(ctx: IRequestContext) {
    const cookies = Cookie.parse(
      (ctx.requestDetails.bodyJson as any).cookies ?? '',
    ) as ICollectedCookies;
    this.saveCollectedCookiesToProfile(cookies, ctx, { getter: 'JsScript', group: 'SameDomain' });
    ctx.res.end();
  }

  private saveFromCss(ctx: IRequestContext) {
    const cookies = collectCookies(ctx);
    this.saveCollectedCookiesToProfile(cookies, ctx, {
      getter: 'HttpAssetHeader',
      group: 'SameDomain',
    });
    ctx.res.end('');
  }

  private redirectToNextPage(ctx: IRequestContext) {
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    ctx.res.end();
  }

  private saveAndRedirectToNextPage(ctx: IRequestContext) {
    this.saveCollectedCookiesToProfile(collectCookies(ctx), ctx);
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    ctx.res.end();
  }

  private setAndRedirectToNextPage(ctx: IRequestContext) {
    const cookiesToSet = createCookies(ctx);
    ctx.res.setHeader('Set-Cookie', cookiesToSet);
    ctx.res.writeHead(302, { location: ctx.nextPageLink });
    ctx.res.end();
    this.saveCreatedCookiesToProfile(cookiesToSet, ctx);
  }

  private set(ctx: IRequestContext) {
    const document = new Document(ctx);
    const cookiesToSet = createCookies(ctx);
    document.addNextPageClick();
    ctx.res.setHeader('Set-Cookie', cookiesToSet);
    ctx.res.end(document.html);
    this.saveCreatedCookiesToProfile(cookiesToSet, ctx);
  }

  private save(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.addNextPageClick();
    this.saveCollectedCookiesToProfile(collectCookies(ctx), ctx);
    ctx.res.end(document.html);
  }

  private saveCreatedCookiesToProfile(
    cookies: ICreatedCookies,
    ctx: IRequestContext,
    extraData: IExtraSaveData = {},
  ) {
    const setter = extraData.setter || CookieSetter.HttpHeader;
    const group = extraData.group || ctx.page.data?.cookieGroup;
    const httpProtocol = ctx.server.protocol;
    const profileData = ctx.session.getPluginProfileData<IProfileData>(this, []);

    const cleanedCookies = cookies.map(x => cleanDomains(x));
    profileData.push({
      group,
      setter,
      httpProtocol,
      cookies: cleanedCookies,
      url: ctx.requestDetails.url,
    });
    ctx.session.savePluginProfileData<IProfileData>(this, profileData, { keepInMemory: true });
  }

  private saveCollectedCookiesToProfile(
    allCookies: ICollectedCookies,
    ctx: IRequestContext,
    extraData: IExtraSaveData = {},
  ) {
    const getter = extraData.getter || CookieGetter.HttpHeader;
    const group = extraData.group || ctx.page.data?.cookieGroup;
    const httpProtocol = ctx.server.protocol;
    const cookies = filterCookies(allCookies, httpProtocol, group);
    const profileData = ctx.session.getPluginProfileData<IProfileData>(this, []);

    profileData.push({ group, getter, httpProtocol, cookies, url: ctx.requestDetails.url });
    ctx.session.savePluginProfileData<IProfileData>(this, profileData, { keepInMemory: true });
  }
}

/////// /////////////////////////////////////////////////////////

function createCookies(ctx: IRequestContext) {
  const domainType = ctx.requestDetails.domainType;
  const cookieGroup = ctx.page.data?.cookieGroup;
  const prefix = `${ctx.server.protocol}-${cookieGroup}`;
  const userAgent = RealUserAgents.findById(ctx.session.userAgentId);
  const isChrome80 = userAgent?.browserId.startsWith('chrome-80');

  const cookies = [
    `${prefix}--Basic=0`,
    `${prefix}--ToBeExpired=start;`,
    `${prefix}--ToBeExpired=start; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `${prefix}--Secure=0; Secure`,
    `${prefix}--HttpOnly=0; HttpOnly`,
    `${prefix}--Expired=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,

    `${prefix}--SameSiteLax=0; SameSite=Lax`,
    `${prefix}--SameSiteLax-Secure=0; SameSite=Lax; Secure`,
    `${prefix}--SameSiteStrict=0; SameSite=Strict`,
    `${prefix}--SameSiteStrict-Secure=0; SameSite=Strict; Secure`,
    `${prefix}--SameSiteNone=0; SameSite=None`,
    `${prefix}--RootPath-Secure=0; Secure; Path=/`,
  ];

  if (!isChrome80) {
    // chrome 80 starts a/b testing for sending ONLY SameSite=None cookies that are "Secure" to cross-site
    cookies.push(`${prefix}--SameSiteNone-Secure=0; SameSite=None; Secure`);
  }

  if ([DomainType.MainDomain, DomainType.SubDomain].includes(domainType)) {
    cookies.push(
      `${prefix}--HttpOnly-MainDomain=0; HttpOnly; Domain=${MainDomain}`,
      `${prefix}--MainDomain-SameSiteNone=0; SameSite=None; Domain=${MainDomain}`,
      `${prefix}--MainDomain-Secure-SameSiteLax=0; Secure; SameSite=Lax; Domain=${MainDomain}`,
      `${prefix}--MainDomain-Secure-SameSiteStrict=0; Secure; SameSite=Strict; Domain=${MainDomain}`,
    );
    if (!isChrome80) {
      // chrome 80 starts a/b testing for sending ONLY SameSite=None cookies that are "Secure" to cross-site
      cookies.push(
        `${prefix}--MainDomain-Secure-SameSiteNone=0; Secure; SameSite=None; Domain=${MainDomain}`,
      );
    }
  }

  return cookies;
}

function collectCookies(ctx) {
  return Cookie.parse(ctx.req.headers.cookie ?? '');
}

function filterCookies(
  cookies: ICollectedCookies,
  httpProtocol: string,
  cookieGroup?: string,
): ICollectedCookies {
  const prefix = `${httpProtocol}-${cookieGroup}--`;
  const filteredCookies: ICollectedCookies = {};

  for (const [name, value] of Object.entries(cookies)) {
    if (name.startsWith(prefix)) {
      filteredCookies[name] = value;
    }
  }

  return filteredCookies;
}

interface IExtraSaveData {
  group?: string;
  getter?: ICookieGetter;
  setter?: ICookieSetter;
}
