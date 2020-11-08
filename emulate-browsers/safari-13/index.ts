import { URL } from 'url';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import {
  BrowserEmulatorClassDecorator,
  getEngineExecutablePath,
  IUserAgent,
  modifyHeaders,
  tcpVars,
  UserAgents,
} from '@secret-agent/emulate-browsers-base';
import {
  canonicalDomain,
  Cookie,
  CookieJar,
  domainMatch,
  getPublicSuffix,
  permuteDomain,
} from 'tough-cookie';
import SameSiteContext from '@secret-agent/commons/interfaces/SameSiteContext';
import IHttpResourceLoadDetails from '@secret-agent/commons/interfaces/IHttpResourceLoadDetails';
import { createPromise, IResolvablePromise, pickRandom } from '@secret-agent/commons/utils';
import { randomBytes } from 'crypto';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';

import pageOverrides from './pageOverrides';
import headerProfiles from './headers.json';
import pkg from './package.json';
import defaultAgents from './user-agents.json';

const engineExecutablePath = process.env.CHROME_83_BIN ?? getEngineExecutablePath(pkg.engine);

@BrowserEmulatorClassDecorator
export default class Safari13 {
  public static id = pkg.name;
  public static statcounterBrowser = 'Safari 13.1';
  public static engine = pkg.engine;

  protected static agents = UserAgents.getList(
    {
      deviceCategory: 'desktop',
      vendor: 'Apple Computer, Inc.',
      family: 'Safari',
      versionMajor: 13,
      versionMinor: 1,
    },
    defaultAgents,
  );

  public engineExecutablePath = engineExecutablePath;
  public engine = pkg.engine;
  public locale = 'en-US';
  public readonly userAgent: IUserAgent;
  public delegate: IHttpRequestModifierDelegate;
  public cookieJar: CookieJar;
  // track sites per safari ITP that are considered to have "first party user interaction"
  public sitesWithUserInteraction: string[] = [];
  // This Flag Should be enabled once double agent deciphers patch level changes
  public enableNov2019ITPSupport = false;

  public enableFeb2020ITPSupport = false;

  public cookiesPendingSiteInteraction: {
    [site: string]: { cookie: Cookie; sourceUrl: string; sameSiteContext: SameSiteContext }[];
  } = {};

  public get canPolyfill() {
    return false;
  }

  public get userProfile(): IUserProfile {
    return this._userProfile;
  }

  public set userProfile(userProfile: IUserProfile) {
    this._userProfile = userProfile;
    if (userProfile.cookies) {
      this.loadProfileCookies();
    }
  }

  private _userProfile: IUserProfile;

  private readonly userInteractionTrigger: {
    [site: string]: IResolvablePromise;
  } = {};

  constructor(userAgent?: IUserAgent) {
    this.userAgent = userAgent ?? pickRandom(Safari13.agents);
    this.cookieJar = new CookieJar(null, { rejectPublicSuffixes: false });
    this.delegate = {
      modifyHeadersBeforeSend: modifyHeaders.bind(this, this.userAgent, headerProfiles),
      tlsProfileId: 'Safari13',
      tcpVars: tcpVars(this.userAgent.os),
      getCookieHeader: this.getCookieHeader.bind(this),
      setCookie: this.setCookie.bind(this),
      documentHasUserActivity: this.documentHasUserActivity.bind(this),
    };
  }

  public async generatePageOverrides() {
    return pageOverrides({
      osFamily: this.userAgent.os.family,
      osVersion: `${this.userAgent.os.major}.${this.userAgent.os.minor}`,
      platform: this.userAgent.platform,
      memory: Math.ceil(Math.random() * 4) * 2,
      languages: this.locale.split(','),
      videoDevice: {
        // TODO: stabilize per user
        deviceId: randomBytes(32).toString('hex'),
        groupId: randomBytes(32).toString('hex'),
      },
      cookieParams: {
        callback: ({ cookie, origin }) => {
          this.cookieJar.setCookie(cookie, origin);
        },
        callbackWindowName: 'SecretAgentSetCookie',
      },
    });
  }

  private loadProfileCookies() {
    const originUrls = (Object.keys(this.userProfile.storage ?? {}) ?? []).map(x => new URL(x));
    const cookies = this.userProfile.cookies;
    for (const cookie of cookies) {
      let url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      const match = originUrls.find(x => {
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

  private documentHasUserActivity(url: URL) {
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

  private async setCookie(cookiestring: string, resource: IHttpResourceLoadDetails) {
    const { url } = resource;
    const hostname = canonicalDomain(url.hostname);
    const cookie = Cookie.parse(cookiestring);
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

  private async getCookieHeader(resource: IHttpResourceLoadDetails) {
    const { url, documentUrl: sourceDocumentUrl } = resource;

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

  private async waitForDocumentCookiesLoaded(url: string) {
    const interactUrl = new URL(url);
    const hostname = canonicalDomain(interactUrl.hostname);
    if (!this.userInteractionTrigger[hostname]) {
      return;
    }
    await this.userInteractionTrigger[hostname];
  }

  private hasFirstPartyInteractionForDomain(domain: string) {
    for (const site of this.sitesWithUserInteraction) {
      const permutations = permuteDomain(site);
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
  ) {
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
      if (!this.sitesWithUserInteraction.some(y => domainMatch(y, domain))) {
        return [];
      }
    }
    return cookies;
  }

  private isMinimumVersion(minor: number, patch = 0) {
    return this.userAgent.version.minor >= minor && this.userAgent.version.patch >= patch;
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
