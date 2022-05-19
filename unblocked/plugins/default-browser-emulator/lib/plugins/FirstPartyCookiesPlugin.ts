import { URL } from 'url';
import {
  canonicalDomain,
  Cookie,
  CookieJar,
  domainMatch,
  getPublicSuffix,
  permuteDomain,
} from 'tough-cookie';
import IHttpResourceLoadDetails from '@unblocked-web/specifications/agent/net/IHttpResourceLoadDetails';
import SameSiteContext from '@ulixee/commons/interfaces/SameSiteContext';
import { IPage } from '@unblocked-web/specifications/agent/browser/IPage';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { createPromise } from '@ulixee/commons/lib/utils';
import DomOverridesBuilder from '../DomOverridesBuilder';
import { IHooksProvider } from '@unblocked-web/specifications/agent/hooks/IHooks';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { UnblockedPluginClassDecorator } from '@unblocked-web/specifications/plugin/IUnblockedPlugin';

@UnblockedPluginClassDecorator
export default class FirstPartyCookiesPlugin implements IHooksProvider {
  public static id = 'FirstPartyCookiesPlugin';

  private cookieJar = new CookieJar(null, { rejectPublicSuffixes: false });
  // track sites per safari ITP that are considered to have "first party user interaction"
  private sitesWithUserInteraction: string[] = [];
  // This Flag Should be enabled once double agent deciphers patch level changes
  private enableNov2019ITPSupport = false;

  private enableFeb2020ITPSupport = false;

  private cookiesPendingSiteInteraction: {
    [site: string]: { cookie: Cookie; sourceUrl: string; sameSiteContext: SameSiteContext }[];
  } = {};

  private readonly userInteractionTrigger: {
    [site: string]: IResolvablePromise;
  } = {};

  private readonly logger: IBoundLog;

  constructor(readonly emulationProfile: IEmulationProfile) {
    this.logger = emulationProfile.logger?.createChild(module);
  }

  public onLoadUserProfileCookies(cookies, storage): void {
    this.loadProfileCookies(cookies, storage);
  }

  public async beforeHttpRequest(request: IHttpResourceLoadDetails): Promise<any> {
    // never send cookies to preflight requests
    if (request.method !== 'OPTIONS') {
      const cookieHeader = await this.getCookieHeader(request);
      const existingCookies = Object.entries(request.requestHeaders).find(([key]) =>
        key.match(/^cookie/i),
      );
      const existingCookie = existingCookies ? existingCookies[1] : null;
      if (existingCookie !== cookieHeader) {
        const headerKey = existingCookies ? existingCookies[0] : 'Cookie';
        if (cookieHeader) {
          request[headerKey] = cookieHeader;
        } else {
          delete request.requestHeaders[headerKey];
        }
      }
    }
  }

  public async beforeHttpResponse(resource: IHttpResourceLoadDetails): Promise<any> {
    let cookies =
      resource.responseHeaders['set-cookie'] ?? resource.responseHeaders['Set-Cookie'] ?? [];
    if (!Array.isArray(cookies)) cookies = [cookies];

    for (const setCookie of cookies) {
      try {
        await this.setCookie(setCookie, resource);
      } catch (error) {
        this.logger.warn('Could not set cookie', { error });
      }
    }
  }

  public onNewPage(page: IPage): Promise<any> {
    const cookieCallbackName = 'HeroSetCookie';
    const domOverrides = new DomOverridesBuilder();
    domOverrides.add('Document.prototype.cookie', {
      callbackName: cookieCallbackName,
    });
    const scripts = domOverrides.build();
    const callback = async ({ cookie, origin }): Promise<void> => {
      try {
        await this.cookieJar.setCookie(cookie, origin);
      } catch (error) {
        this.logger.warn('Error setting cookie from page', { error });
      }
    };

    const promises: any[] = [
      page.addPageCallback(cookieCallbackName, (payload) => {
        return callback(JSON.parse(payload));
      }),
    ];

    for (const script of scripts) {
      promises.push(page.addNewDocumentScript(script.script, false));
    }

    return Promise.all(promises);
  }

  public websiteHasFirstPartyInteraction(url: URL): void {
    this.documentHasUserActivity(url);
  }

  private loadProfileCookies(cookies, storage): void {
    const originUrls = (Object.keys(storage ?? {}) ?? []).map((x) => new URL(x));
    for (const cookie of cookies) {
      let url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      const match = originUrls.find((x) => {
        return x.hostname.endsWith(cookie.domain);
      });
      if (match) url = match.href;
      const cookieProps = {
        ...cookie,
        key: cookie.name,
        expires: cookie.expires !== '-1' ? new Date(parseInt(cookie.expires, 10)) : undefined,
      };
      if (!cookieProps.expires) delete cookieProps.expires;
      this.cookieJar.setCookieSync(new Cookie(cookieProps), url, {
        ignoreError: true,
      });
    }
    for (const origin of originUrls) {
      this.documentHasUserActivity(origin);
    }
  }

  private documentHasUserActivity(url: URL): void {
    const hostname = canonicalDomain(url.hostname);
    if (!this.sitesWithUserInteraction.includes(hostname)) {
      this.sitesWithUserInteraction.push(hostname);
      let documentLoaded = this.userInteractionTrigger[hostname];
      if (!documentLoaded) {
        documentLoaded = createPromise();
        this.userInteractionTrigger[hostname] = documentLoaded;
      }

      (async () => {
        for (const { cookie, sourceUrl, sameSiteContext } of this.cookiesPendingSiteInteraction[
          hostname
        ] ?? []) {
          await this.cookieJar.setCookie(cookie, sourceUrl, {
            sameSiteContext,
          } as any);
        }
        delete this.cookiesPendingSiteInteraction[hostname];
      })()
        .then(documentLoaded.resolve)
        .catch(documentLoaded.reject);
    }
  }

  private async setCookie(cookieString: string, resource: IHttpResourceLoadDetails): Promise<void> {
    const { url } = resource;
    const hostname = canonicalDomain(url.hostname);
    const cookie = Cookie.parse(cookieString);
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
    } as any);
  }

  private async getCookieHeader(resource: IHttpResourceLoadDetails): Promise<string> {
    const { url, documentUrl } = resource;

    let sourceDocumentUrl = documentUrl;
    if (!sourceDocumentUrl && resource.isUserNavigation) sourceDocumentUrl = url.href;

    let sameSiteContext = getSameSiteContext(resource);
    if (resource.isFromRedirect) {
      const currentUrl = resource.url;
      const previousDomain = new URL(resource.firstRedirectingUrl);

      if (getPublicSuffix(previousDomain.hostname) === getPublicSuffix(currentUrl.hostname)) {
        sameSiteContext = 'strict';
      }
    }
    await this.waitForDocumentCookiesLoaded(sourceDocumentUrl);
    let cookies = await this.cookieJar.getCookies(url.href, {
      sameSiteContext,
    } as any);

    if (sameSiteContext === 'none') {
      cookies = cookies.filter((x) => this.hasFirstPartyInteractionForDomain(x.domain));
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

    return cookies.map((x) => x.cookieString()).join('; ');
  }

  private async waitForDocumentCookiesLoaded(url: string): Promise<void> {
    const interactUrl = new URL(url);
    const hostname = canonicalDomain(interactUrl.hostname);
    if (!this.userInteractionTrigger[hostname]) {
      return;
    }
    await this.userInteractionTrigger[hostname];
  }

  private hasFirstPartyInteractionForDomain(domain: string): boolean {
    for (const site of this.sitesWithUserInteraction) {
      const permutations = permuteDomain(site) ?? [site.split('.').slice(-2).join('.'), site];
      for (const perm of permutations) {
        if (domainMatch(perm, domain)) return true;
      }
    }
    return false;
  }

  private handleNov2019ITPUpdates(
    sourceDocumentUrl: string,
    sameSiteContext: SameSiteContext,
    cookies: Cookie[],
  ): Cookie[] {
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
      const domain = canonicalDomain(sourceDocumentUrl);
      if (!this.sitesWithUserInteraction.some((y) => domainMatch(y, domain))) {
        return [];
      }
    }
    return cookies;
  }

  private isMinimumVersion(minor: number, patch = 0): boolean {
    const { browserVersion } = this.emulationProfile.userAgentOption;
    return Number(browserVersion.minor) >= minor && Number(browserVersion.patch) >= patch;
  }
}

function getSameSiteContext(resource: IHttpResourceLoadDetails): SameSiteContext {
  const { hasUserGesture, originType } = resource;
  if (originType === 'same-site' || originType === 'same-origin' || originType === 'none') {
    return 'strict';
  }
  if (hasUserGesture) {
    return 'lax';
  }
  return 'none';
}
