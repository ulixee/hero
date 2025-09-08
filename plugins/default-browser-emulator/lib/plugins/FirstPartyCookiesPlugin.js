"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const tough_cookie_1 = require("tough-cookie");
const utils_1 = require("@ulixee/commons/lib/utils");
const IUnblockedPlugin_1 = require("@ulixee/unblocked-specification/plugin/IUnblockedPlugin");
const DomOverridesBuilder_1 = require("../DomOverridesBuilder");
const IBrowserEmulatorConfig_1 = require("../../interfaces/IBrowserEmulatorConfig");
let FirstPartyCookiesPlugin = class FirstPartyCookiesPlugin {
    constructor(emulationProfile) {
        this.emulationProfile = emulationProfile;
        this.cookieJar = new tough_cookie_1.CookieJar(null, { rejectPublicSuffixes: false });
        // track sites per safari ITP that are considered to have "first party user interaction"
        this.sitesWithUserInteraction = [];
        // This Flag Should be enabled once double agent deciphers patch level changes
        this.enableNov2019ITPSupport = false;
        this.enableFeb2020ITPSupport = false;
        this.cookiesPendingSiteInteraction = {};
        this.userInteractionTrigger = {};
        this.logger = emulationProfile.logger?.createChild(module);
    }
    onLoadUserProfileCookies(cookies, storage) {
        this.loadProfileCookies(cookies, storage);
    }
    async beforeHttpRequest(request) {
        // never send cookies to preflight requests
        if (request.method !== 'OPTIONS') {
            const cookieHeader = await this.getCookieHeader(request);
            const existingCookies = Object.entries(request.requestHeaders).find(([key]) => key.match(/^cookie/i));
            const existingCookie = existingCookies ? existingCookies[1] : null;
            if (existingCookie !== cookieHeader) {
                const headerKey = existingCookies ? existingCookies[0] : 'Cookie';
                if (cookieHeader) {
                    request[headerKey] = cookieHeader;
                }
                else {
                    delete request.requestHeaders[headerKey];
                }
            }
        }
    }
    async beforeHttpResponse(resource) {
        let cookies = resource.responseHeaders['set-cookie'] ?? resource.responseHeaders['Set-Cookie'] ?? [];
        if (!Array.isArray(cookies))
            cookies = [cookies];
        for (const setCookie of cookies) {
            try {
                await this.setCookie(setCookie, resource);
            }
            catch (error) {
                this.logger.warn('Could not set cookie', { error });
            }
        }
    }
    onNewPage(page) {
        const cookieCallbackName = 'HeroSetCookie';
        const domOverrides = new DomOverridesBuilder_1.default();
        domOverrides.add(IBrowserEmulatorConfig_1.InjectedScript.DOCUMENT_PROTOTYPE_COOKIE, {
            callbackName: cookieCallbackName,
        });
        const scripts = domOverrides.build();
        return page.addNewDocumentScript(scripts.script, false, {
            async onCookie(payload) {
                try {
                    const { cookie, origin } = JSON.parse(payload);
                    await this.cookieJar.setCookie(cookie, origin);
                }
                catch (error) {
                    this.logger.warn('Error setting cookie from page', { error });
                }
            },
        });
    }
    websiteHasFirstPartyInteraction(url) {
        this.documentHasUserActivity(url);
    }
    loadProfileCookies(cookies, storage) {
        const originUrls = (Object.keys(storage ?? {}) ?? []).map(x => new url_1.URL(x));
        for (const cookie of cookies) {
            let url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
            const match = originUrls.find(x => {
                return x.hostname.endsWith(cookie.domain);
            });
            if (match)
                url = match.href;
            const cookieProps = {
                ...cookie,
                key: cookie.name,
                expires: cookie.expires !== '-1' ? new Date(parseInt(cookie.expires, 10)) : undefined,
            };
            if (!cookieProps.expires)
                delete cookieProps.expires;
            this.cookieJar.setCookieSync(new tough_cookie_1.Cookie(cookieProps), url, {
                ignoreError: true,
            });
        }
        for (const origin of originUrls) {
            this.documentHasUserActivity(origin);
        }
    }
    documentHasUserActivity(url) {
        const hostname = (0, tough_cookie_1.canonicalDomain)(url.hostname);
        if (!this.sitesWithUserInteraction.includes(hostname)) {
            this.sitesWithUserInteraction.push(hostname);
            let documentLoaded = this.userInteractionTrigger[hostname];
            if (!documentLoaded) {
                documentLoaded = (0, utils_1.createPromise)();
                this.userInteractionTrigger[hostname] = documentLoaded;
            }
            (async () => {
                for (const { cookie, sourceUrl, sameSiteContext } of this.cookiesPendingSiteInteraction[hostname] ?? []) {
                    await this.cookieJar.setCookie(cookie, sourceUrl, {
                        sameSiteContext,
                    });
                }
                delete this.cookiesPendingSiteInteraction[hostname];
            })()
                .then(documentLoaded.resolve)
                .catch(documentLoaded.reject);
        }
    }
    async setCookie(cookieString, resource) {
        const { url } = resource;
        const hostname = (0, tough_cookie_1.canonicalDomain)(url.hostname);
        const cookie = tough_cookie_1.Cookie.parse(cookieString);
        const sameSiteContext = getSameSiteContext(resource);
        if (resource.hasUserGesture) {
            this.documentHasUserActivity(url);
        }
        if (!this.sitesWithUserInteraction.includes(hostname)) {
            if (!this.cookiesPendingSiteInteraction[hostname]) {
                this.cookiesPendingSiteInteraction[hostname] = [];
            }
            if (this.enableNov2019ITPSupport) {
                this.cookiesPendingSiteInteraction[hostname].push({
                    sourceUrl: url.href,
                    cookie,
                    sameSiteContext,
                });
                return;
            }
        }
        await this.cookieJar.setCookie(cookie, url.href, {
            sameSiteContext,
        });
    }
    async getCookieHeader(resource) {
        const { url, documentUrl } = resource;
        let sourceDocumentUrl = documentUrl;
        if (!sourceDocumentUrl && resource.isUserNavigation)
            sourceDocumentUrl = url.href;
        let sameSiteContext = getSameSiteContext(resource);
        if (resource.isFromRedirect) {
            const currentUrl = resource.url;
            const previousDomain = new url_1.URL(resource.firstRedirectingUrl);
            if ((0, tough_cookie_1.getPublicSuffix)(previousDomain.hostname) === (0, tough_cookie_1.getPublicSuffix)(currentUrl.hostname)) {
                sameSiteContext = 'strict';
            }
        }
        await this.waitForDocumentCookiesLoaded(sourceDocumentUrl);
        let cookies = await this.cookieJar.getCookies(url.href, {
            sameSiteContext,
        });
        if (sameSiteContext === 'none') {
            cookies = cookies.filter(x => this.hasFirstPartyInteractionForDomain(x.domain));
        }
        cookies = this.handleNov2019ITPUpdates(sourceDocumentUrl, sameSiteContext, cookies);
        /** *
         * TBD:
         * >> Safari 13.1
         * (https://webkit.org/blog/9661/preventing-tracking-prevention-tracking/)
         * Cookies for cross-site resources are now blocked by default across the board. This is a
         * significant improvement for privacy since it removes any sense of exceptions or “a little bit
         * of cross-site tracking is allowed.”
         */
        if (this.enableFeb2020ITPSupport && this.isMinimumVersion(1) && sameSiteContext === 'none') {
            cookies = [];
        }
        return cookies.map(x => x.cookieString()).join('; ');
    }
    async waitForDocumentCookiesLoaded(url) {
        const interactUrl = new url_1.URL(url);
        const hostname = (0, tough_cookie_1.canonicalDomain)(interactUrl.hostname);
        if (!this.userInteractionTrigger[hostname]) {
            return;
        }
        await this.userInteractionTrigger[hostname];
    }
    hasFirstPartyInteractionForDomain(domain) {
        for (const site of this.sitesWithUserInteraction) {
            const permutations = (0, tough_cookie_1.permuteDomain)(site) ?? [site.split('.').slice(-2).join('.'), site];
            for (const perm of permutations) {
                if ((0, tough_cookie_1.domainMatch)(perm, domain))
                    return true;
            }
        }
        return false;
    }
    handleNov2019ITPUpdates(sourceDocumentUrl, sameSiteContext, cookies) {
        if (!this.enableNov2019ITPSupport) {
            return cookies;
        }
        /**
         * https://webkit.org/blog/9521/intelligent-tracking-prevention-2-3/
         *
         * >> Safari 13.0.4 on macOS Catalina, Mojave, and High Sierra.
         * (https://webkit.org/blog/9661/preventing-tracking-prevention-tracking/)
         * ITP will now block all third-party requests from seeing their cookies, regardless of the
         * classification status of the third-party domain, unless the first-party website has already
         * received user interaction.
         *
         * Safari’s default cookie policy requires a third-party to have “seeded” its cookie jar as first-party
         * before it can use cookies as third-party. This means the absence of cookies in a third-party request
         * can be due to ITP blocking existing cookies or the default cookie policy blocking cookies because the
         * user never visited the website, the website’s cookies have expired, or because the user or
         * ITP has explicitly deleted the website’s cookies.
         */
        if (this.isMinimumVersion(0, 4) && sameSiteContext !== 'strict') {
            const domain = (0, tough_cookie_1.canonicalDomain)(sourceDocumentUrl);
            if (!this.sitesWithUserInteraction.some(y => (0, tough_cookie_1.domainMatch)(y, domain))) {
                return [];
            }
        }
        return cookies;
    }
    isMinimumVersion(minor, patch = 0) {
        const { browserVersion } = this.emulationProfile.userAgentOption;
        return Number(browserVersion.minor) >= minor && Number(browserVersion.patch) >= patch;
    }
};
FirstPartyCookiesPlugin.id = 'FirstPartyCookiesPlugin';
FirstPartyCookiesPlugin = __decorate([
    IUnblockedPlugin_1.UnblockedPluginClassDecorator
], FirstPartyCookiesPlugin);
exports.default = FirstPartyCookiesPlugin;
function getSameSiteContext(resource) {
    const { hasUserGesture, originType } = resource;
    if (originType === 'same-site' || originType === 'same-origin' || originType === 'none') {
        return 'strict';
    }
    if (hasUserGesture) {
        return 'lax';
    }
    return 'none';
}
//# sourceMappingURL=FirstPartyCookiesPlugin.js.map