"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cookie = require("cookie");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const DomainUtils_1 = require("@double-agent/collect/lib/DomainUtils");
const index_1 = require("@double-agent/config/index");
const IProfile_1 = require("./interfaces/IProfile");
const { MainDomain, CrossDomain, SubDomain } = index_1.default.collect.domains;
class HttpCookiesPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('allHttp1', '/start', this.start);
        this.registerRoute('allHttp1', '/saveLoadAssetsAndReadFromJs', this.saveLoadAssetsAndReadFromJs);
        this.registerRoute('allHttp1', '/saveFromJs', this.saveFromJs);
        this.registerRoute('allHttp1', '/test.css', this.saveFromCss);
        this.registerRoute('allHttp1', '/redirectToNextPage', this.redirectToNextPage);
        this.registerRoute('allHttp1', '/saveAndRedirectToNextPage', this.saveAndRedirectToNextPage);
        this.registerRoute('allHttp1', '/setAndRedirectToNextPage', this.setAndRedirectToNextPage);
        this.registerRoute('allHttp1', '/set', this.set);
        this.registerRoute('allHttp1', '/save', this.save);
        const pages = [];
        ['http', 'https'].forEach(protocol => {
            // set cookies on server, then set cookies on client, then read cookies on client, load test.css, load subsequent page
            let data = { cookieGroup: 'SameDomain' };
            pages.push({ route: this.routes[protocol]['/start'], domain: MainDomain, clickNext: true, data }, {
                route: this.routes[protocol]['/saveLoadAssetsAndReadFromJs'],
                domain: MainDomain,
                clickNext: true,
                data,
            });
            // try setting cookies on cross-domain during redirect
            data = { cookieGroup: 'CrossDomainRedirect' };
            pages.push({
                route: this.routes[protocol]['/redirectToNextPage'],
                domain: MainDomain,
                isRedirect: true,
            }, {
                route: this.routes[protocol]['/setAndRedirectToNextPage'],
                domain: CrossDomain,
                isRedirect: true,
                data,
            }, {
                route: this.routes[protocol]['/saveAndRedirectToNextPage'],
                domain: MainDomain,
                isRedirect: true,
                data,
            });
            // try setting cookies on sub-domain during redirect
            data = { cookieGroup: 'SubDomainRedirect' };
            pages.push({
                route: this.routes[protocol]['/setAndRedirectToNextPage'],
                domain: SubDomain,
                isRedirect: true,
                data,
            }, { route: this.routes[protocol]['/save'], domain: MainDomain, clickNext: true, data });
            data = { cookieGroup: 'SubDomain' };
            pages.push({ route: this.routes[protocol]['/set'], domain: SubDomain, clickNext: true, data }, { route: this.routes[protocol]['/save'], domain: MainDomain, clickNext: true, data });
            data = { cookieGroup: 'CrossDomain' };
            pages.push(
            //
            { route: this.routes[protocol]['/set'], domain: CrossDomain, clickNext: true, data }, { route: this.routes[protocol]['/save'], domain: MainDomain, data });
        });
        this.registerPages(...pages);
    }
    changePluginOrder(plugins) {
        plugins.splice(plugins.indexOf(this), 1);
        plugins.push(this);
    }
    start(ctx) {
        const document = new Document_1.default(ctx);
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
    saveLoadAssetsAndReadFromJs(ctx) {
        const document = new Document_1.default(ctx);
        document.addNextPageClick();
        document.injectHeadTag(`<link rel="stylesheet" type="text/css" href="${ctx.buildUrl('/test.css')}" />`);
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
    saveFromJs(ctx) {
        const cookies = Cookie.parse(ctx.requestDetails.bodyJson.cookies ?? '');
        this.saveCollectedCookiesToProfile(cookies, ctx, { getter: 'JsScript', group: 'SameDomain' });
        ctx.res.end();
    }
    saveFromCss(ctx) {
        const cookies = collectCookies(ctx);
        this.saveCollectedCookiesToProfile(cookies, ctx, {
            getter: 'HttpAssetHeader',
            group: 'SameDomain',
        });
        ctx.res.end('');
    }
    redirectToNextPage(ctx) {
        ctx.res.writeHead(302, { location: ctx.nextPageLink });
        ctx.res.end();
    }
    saveAndRedirectToNextPage(ctx) {
        this.saveCollectedCookiesToProfile(collectCookies(ctx), ctx);
        ctx.res.writeHead(302, { location: ctx.nextPageLink });
        ctx.res.end();
    }
    setAndRedirectToNextPage(ctx) {
        const cookiesToSet = createCookies(ctx);
        ctx.res.setHeader('Set-Cookie', cookiesToSet);
        ctx.res.writeHead(302, { location: ctx.nextPageLink });
        ctx.res.end();
        this.saveCreatedCookiesToProfile(cookiesToSet, ctx);
    }
    set(ctx) {
        const document = new Document_1.default(ctx);
        const cookiesToSet = createCookies(ctx);
        document.addNextPageClick();
        ctx.res.setHeader('Set-Cookie', cookiesToSet);
        ctx.res.end(document.html);
        this.saveCreatedCookiesToProfile(cookiesToSet, ctx);
    }
    save(ctx) {
        const document = new Document_1.default(ctx);
        document.addNextPageClick();
        this.saveCollectedCookiesToProfile(collectCookies(ctx), ctx);
        ctx.res.end(document.html);
    }
    saveCreatedCookiesToProfile(cookies, ctx, extraData = {}) {
        const setter = extraData.setter || IProfile_1.CookieSetter.HttpHeader;
        const group = extraData.group || ctx.page.data?.cookieGroup;
        const httpProtocol = ctx.server.protocol;
        const profileData = ctx.session.getPluginProfileData(this, []);
        const cleanedCookies = cookies.map(x => (0, DomainUtils_1.cleanDomains)(x));
        profileData.push({
            group,
            setter,
            httpProtocol,
            cookies: cleanedCookies,
            url: ctx.requestDetails.url,
        });
        ctx.session.savePluginProfileData(this, profileData, { keepInMemory: true });
    }
    saveCollectedCookiesToProfile(allCookies, ctx, extraData = {}) {
        const getter = extraData.getter || IProfile_1.CookieGetter.HttpHeader;
        const group = extraData.group || ctx.page.data?.cookieGroup;
        const httpProtocol = ctx.server.protocol;
        const cookies = filterCookies(allCookies, httpProtocol, group);
        const profileData = ctx.session.getPluginProfileData(this, []);
        profileData.push({ group, getter, httpProtocol, cookies, url: ctx.requestDetails.url });
        ctx.session.savePluginProfileData(this, profileData, { keepInMemory: true });
    }
}
exports.default = HttpCookiesPlugin;
/////// /////////////////////////////////////////////////////////
function createCookies(ctx) {
    const domainType = ctx.requestDetails.domainType;
    const cookieGroup = ctx.page.data?.cookieGroup;
    const prefix = `${ctx.server.protocol}-${cookieGroup}`;
    const userAgent = real_user_agents_1.default.findById(ctx.session.userAgentId);
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
    if ([DomainUtils_1.DomainType.MainDomain, DomainUtils_1.DomainType.SubDomain].includes(domainType)) {
        cookies.push(`${prefix}--HttpOnly-MainDomain=0; HttpOnly; Domain=${MainDomain}`, `${prefix}--MainDomain-SameSiteNone=0; SameSite=None; Domain=${MainDomain}`, `${prefix}--MainDomain-Secure-SameSiteLax=0; Secure; SameSite=Lax; Domain=${MainDomain}`, `${prefix}--MainDomain-Secure-SameSiteStrict=0; Secure; SameSite=Strict; Domain=${MainDomain}`);
        if (!isChrome80) {
            // chrome 80 starts a/b testing for sending ONLY SameSite=None cookies that are "Secure" to cross-site
            cookies.push(`${prefix}--MainDomain-Secure-SameSiteNone=0; Secure; SameSite=None; Domain=${MainDomain}`);
        }
    }
    return cookies;
}
function collectCookies(ctx) {
    return Cookie.parse(ctx.req.headers.cookie ?? '');
}
function filterCookies(cookies, httpProtocol, cookieGroup) {
    const prefix = `${httpProtocol}-${cookieGroup}--`;
    const filteredCookies = {};
    for (const [name, value] of Object.entries(cookies)) {
        if (name.startsWith(prefix)) {
            filteredCookies[name] = value;
        }
    }
    return filteredCookies;
}
//# sourceMappingURL=index.js.map