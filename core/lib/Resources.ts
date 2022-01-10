import {
  IRequestSessionHttpErrorEvent,
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
} from '@ulixee/hero-mitm/handlers/RequestSession';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import BrowserRequestMatcher from '@ulixee/hero-mitm/lib/BrowserRequestMatcher';
import MitmRequestContext from '@ulixee/hero-mitm/lib/MitmRequestContext';
import { IPuppetResourceRequest } from '@ulixee/hero-interfaces/IPuppetNetworkEvents';
import ResourcesTable from '../models/ResourcesTable';
import Session from './Session';
import { ICookie } from '@ulixee/hero-interfaces/ICookie';
import { Cookie } from 'tough-cookie';
import StorageChangesTable, { IStorageChangesEntry } from '../models/StorageChangesTable';

const { log } = Log(module);

export default class Resources {
  public readonly browserRequestIdToResources: {
    [browserRequestId: string]: IResourceMeta[];
  } = {};

  public readonly resourcesById = new Map<number, IResourceMeta>();
  public readonly cookiesByDomain = new Map<string, Record<string, ICookie>>();

  private readonly mitmErrorsByUrl = new Map<
    string,
    {
      resourceId: number;
      event: IRequestSessionHttpErrorEvent;
    }[]
  >();

  private readonly logger: IBoundLog;
  private readonly model: ResourcesTable;
  private readonly cookiesModel: StorageChangesTable;

  constructor(
    private readonly session: Session,
    readonly browserRequestMatcher: BrowserRequestMatcher,
  ) {
    this.model = session.db.resources;
    this.cookiesModel = session.db.storageChanges;
    this.logger = log.createChild(module, {
      sessionId: session.id,
    });
  }

  public getForTab(tabId: number): IResourceMeta[] {
    const resources: IResourceMeta[] = [];
    for (const resource of this.resourcesById.values()) {
      if (resource.tabId === tabId) resources.push(resource);
    }
    return resources;
  }

  public get(id: number): IResourceMeta {
    return this.resourcesById.get(id);
  }

  public recordSeen(resource: IResourceMeta, atCommandId: number): void {
    this.get(resource.id).seenAtCommandId = atCommandId;
  }

  /////// BROWSER REQUEST ID MAPPING ///////////////////////////////////////////////////////////////////////////////////

  public getBrowserRequestTabId(browserRequestId: string): number {
    return this.browserRequestMatcher.requestIdToTabId.get(browserRequestId);
  }

  public getBrowserRequestLatestResource(browserRequestId: string): IResourceMeta {
    const resources = this.browserRequestIdToResources[browserRequestId];
    if (!resources?.length) {
      return;
    }

    return resources[resources.length - 1];
  }

  public trackBrowserRequestToResourceId(browserRequestId: string, resource: IResourceMeta): void {
    if (!browserRequestId) return;
    // NOTE: browserRequestId can be shared amongst redirects
    this.browserRequestIdToResources[browserRequestId] ??= [];
    const resources = this.browserRequestIdToResources[browserRequestId];
    const replaceIdx = resources.findIndex(x => x.id === resource.id);
    if (replaceIdx !== -1) resources[replaceIdx] = resource;
    else resources.push(resource);
  }

  public async createNewResourceIfUnseen(
    tabId: number,
    frameId: number,
    resourceRequest: IPuppetResourceRequest,
    getBody: () => Promise<Buffer>,
  ): Promise<IResourceMeta | null> {
    if (this.browserRequestIdToResources[resourceRequest.browserRequestId]) return;

    const ctx = MitmRequestContext.createFromPuppetResourceRequest(resourceRequest);
    const resourceDetails = MitmRequestContext.toEmittedResource(ctx);
    if (!resourceRequest.browserServedFromCache) {
      resourceDetails.body = await getBody();
      if (resourceDetails.body) {
        delete resourceDetails.response.headers['content-encoding'];
        delete resourceDetails.response.headers['Content-Encoding'];
      }
    }
    return this.record(tabId, resourceDetails, true);
  }

  public onBrowserResourceLoaded(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
  ): boolean {
    const knownResource = this.getBrowserRequestLatestResource(resource.browserRequestId);
    if (knownResource) {
      if (!knownResource.response) {
        const ctx = MitmRequestContext.createFromPuppetResourceRequest(resource);
        const resourceDetails = MitmRequestContext.toEmittedResource(ctx);
        knownResource.response = resourceDetails.response;
      }
      knownResource.response.browserLoadedTime = resource.browserLoadedTime;
      knownResource.frameId ??= frameId;
      this.model.updateReceivedTime(knownResource.id, resource.browserLoadedTime);
      return true;
    }

    const isMitmError = this.matchesMitmError(
      tabId,
      resource.url.href,
      resource.method,
      resource.browserRequestId,
      resource.requestTime,
    );
    if (isMitmError) {
      return true;
    }

    return false;
  }

  public onBrowserWillRequest(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
  ): void {
    this.browserRequestMatcher.onBrowserRequestedResource(resource, tabId, frameId);
  }

  public onBrowserDidRequest(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
  ): void {
    this.browserRequestMatcher.onBrowserRequestedResourceExtraDetails(resource, tabId, frameId);
  }

  public onBrowserRequestFailed(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
    loadError: Error,
  ): IResourceMeta {
    const resourceId =
      this.browserRequestMatcher.onBrowserRequestFailed({
        resource,
        tabId,
        frameId,
        loadError,
      }) ?? this.getBrowserRequestLatestResource(resource.browserRequestId)?.id;

    // this function will resolve any pending resourceId for a navigation
    return this.recordFailed(
      tabId,
      MitmRequestContext.toEmittedResource({ id: resourceId, ...resource } as any),
      loadError,
    );
  }

  /////// STORAGE //////////////////////////////////////////////////////////////////////////////////////////////////////

  public record(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
    isResponse: boolean,
  ): IResourceMeta {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    const resourceResponseEvent = resourceEvent as IRequestSessionResponseEvent;

    this.model.insert(tabId, resource, resourceResponseEvent.body, resourceEvent);

    if (isResponse) {
      this.resourcesById.set(resource.id, resource);

      const responseEvent = resourceEvent as IRequestSessionResponseEvent;
      this.recordCookies(tabId, responseEvent);
    }
    return resource;
  }

  public recordFailed(
    tabId: number,
    resourceFailedEvent: IRequestSessionResponseEvent,
    error: Error,
  ): IResourceMeta {
    const resourceId = resourceFailedEvent.id;
    if (!resourceId) {
      this.logger.warn('Session.FailedResourceWithoutId', {
        resourceFailedEvent,
        error,
      });
      return;
    }

    try {
      const convertedMeta = this.resourceEventToMeta(tabId, resourceFailedEvent);
      const resource = this.resourcesById.get(resourceId);

      if (!resource) {
        this.resourcesById.set(convertedMeta.id, convertedMeta);
        this.model.insert(tabId, convertedMeta, null, resourceFailedEvent, error);
        return convertedMeta;
      }

      // if we already have this resource, we need to merge
      const existingDbRecord = this.model.get(resourceId);

      existingDbRecord.type ??= convertedMeta.type;
      resource.type ??= convertedMeta.type;
      existingDbRecord.devtoolsRequestId ??= resourceFailedEvent.browserRequestId;
      existingDbRecord.browserBlockedReason = resourceFailedEvent.browserBlockedReason;
      existingDbRecord.browserCanceled = resourceFailedEvent.browserCanceled;
      existingDbRecord.redirectedToUrl ??= resourceFailedEvent.redirectedToUrl;
      existingDbRecord.statusCode ??= convertedMeta.response.statusCode;
      existingDbRecord.statusMessage ??= convertedMeta.response.statusMessage;
      existingDbRecord.browserLoadFailure = convertedMeta.response.browserLoadFailure;
      existingDbRecord.browserLoadedTimestamp ??= convertedMeta.response.timestamp;
      existingDbRecord.frameId ??= convertedMeta.frameId;

      if (!resource.response) {
        resource.response = convertedMeta.response ?? ({} as any);
      }

      if (convertedMeta.response.headers) {
        const responseHeaders = JSON.stringify(convertedMeta.response.headers);
        if (responseHeaders.length > existingDbRecord.responseHeaders?.length) {
          existingDbRecord.responseHeaders = responseHeaders;
          resource.response.headers = convertedMeta.response.headers;
        }
      }
      if (resourceFailedEvent.responseOriginalHeaders) {
        const responseHeaders = JSON.stringify(resourceFailedEvent.responseOriginalHeaders);
        if (responseHeaders.length > existingDbRecord.responseOriginalHeaders?.length) {
          existingDbRecord.responseOriginalHeaders = responseHeaders;
        }
      }
      if (error) {
        existingDbRecord.httpError = ResourcesTable.getErrorString(error);
      }

      resource.response.browserLoadFailure = convertedMeta.response?.browserLoadFailure;

      this.model.save(existingDbRecord);
      return resource;
    } catch (saveError) {
      this.logger.warn('Resources.captureResourceFailed::ErrorSaving', {
        error: saveError,
        resourceFailedEvent,
      });
    }
  }

  /////// MITM ERRORS

  public onMitmRequestError(
    tabId: number,
    event: IRequestSessionHttpErrorEvent,
    error: Error,
  ): IResourceMeta {
    const request = event.request;
    const resource = this.resourceEventToMeta(tabId, request);
    this.model.insert(tabId, resource, null, request, error);

    if (!this.resourcesById.has(resource.id)) {
      this.resourcesById.set(resource.id, resource);
    }

    const url = resource.request?.url;
    if (!request.browserRequestId && url) {
      const existing = this.mitmErrorsByUrl.get(url) ?? [];
      existing.push({
        resourceId: resource.id,
        event,
      });
      this.mitmErrorsByUrl.set(url, existing);
    }
    return resource;
  }

  private recordCookies(tabId: number, responseEvent: IRequestSessionResponseEvent): void {
    const { response } = responseEvent;
    if (!response?.headers) return;

    let setCookie = response.headers['set-cookie'] ?? response.headers['Set-Cookie'];
    if (!setCookie) return;

    if (!Array.isArray(setCookie)) setCookie = [setCookie];
    const defaultDomain = responseEvent.url.host;
    for (const cookieHeader of setCookie) {
      const cookie = Cookie.parse(cookieHeader, { loose: true });
      let domain = cookie.domain || defaultDomain;
      // restore stripped leading .
      if (cookie.domain && cookieHeader.toLowerCase().includes(`domain=.${domain}`)) {
        domain = `.${domain}`;
      }
      if (!this.cookiesByDomain.has(domain)) this.cookiesByDomain.set(domain, {});
      const domainCookies = this.cookiesByDomain.get(domain);
      let action: IStorageChangesEntry['action'] = 'add';
      const existing = domainCookies[cookie.key];
      if (existing) {
        if (cookie.expires && cookie.expires < new Date()) {
          action = 'remove';
        } else {
          action = 'update';
        }
      }

      let finalCookie: ICookie;
      if (action === 'remove') {
        delete domainCookies[cookie.key];
      } else {
        finalCookie = {
          name: cookie.key,
          sameSite: cookie.sameSite as any,
          url: responseEvent.url.href,
          domain,
          path: cookie.path,
          httpOnly: cookie.httpOnly,
          value: cookie.value,
          secure: cookie.secure,
          expires: cookie.expires instanceof Date ? cookie.expires.toISOString() : undefined,
        };

        if (areCookiesEqual(existing, finalCookie)) continue;

        domainCookies[finalCookie.name] = finalCookie;
      }
      this.cookiesModel.insert(tabId, responseEvent.frameId, {
        type: 'cookie' as any,
        action,
        securityOrigin: responseEvent.url.origin,
        key: cookie.key,
        value: finalCookie?.value,
        meta: finalCookie,
        timestamp: response.browserLoadedTime ?? response.timestamp,
      });
    }
  }

  private matchesMitmError(
    tabId: number,
    url: string,
    method: string,
    browserRequestId: string,
    requestTime: number,
  ): boolean {
    // first check if this is a mitm error
    const errorsMatchingUrl = this.mitmErrorsByUrl.get(url);
    if (!errorsMatchingUrl) return false;

    // if this resource error-ed out,
    for (const entry of errorsMatchingUrl) {
      const { event, resourceId } = entry;
      const request = event?.request?.request;
      const isMatch = request?.method === method && Math.abs(request.timestamp - requestTime) < 500;
      if (!isMatch) continue;

      const idx = errorsMatchingUrl.indexOf(entry);
      errorsMatchingUrl.splice(idx, 1);

      const resource = this.resourcesById.get(resourceId);
      if (resource) {
        resource.tabId = tabId;
        this.trackBrowserRequestToResourceId(browserRequestId, resource);
        this.model.updateResource(resourceId, { browserRequestId, tabId });
      }
      return true;
    }
    return false;
  }

  private resourceEventToMeta(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
  ): IResourceMeta {
    const { request, response, resourceType, browserRequestId, frameId, redirectedToUrl } =
      resourceEvent as IRequestSessionResponseEvent;

    const resource = {
      id: resourceEvent.id,
      tabId,
      frameId,
      url: request.url,
      receivedAtCommandId: this.session.commands.lastId,
      type: resourceType,
      isRedirect: !!redirectedToUrl,
      documentUrl: resourceEvent.documentUrl,
      request: {
        ...request,
      },
    } as IResourceMeta;

    if (response?.statusCode || response?.browserServedFromCache || response?.browserLoadFailure) {
      resource.response = response;
      if (response.url) resource.url = response.url;
      else resource.response.url = request.url;
    }

    this.trackBrowserRequestToResourceId(browserRequestId, resource);

    return resource;
  }

  public static translateResourceError(resource: IPuppetResourceRequest): Error {
    if (resource.browserLoadFailure) {
      return new Error(resource.browserLoadFailure);
    }
    if (resource.browserBlockedReason) {
      return new Error(`Resource blocked: "${resource.browserBlockedReason}"`);
    }
    if (resource.browserCanceled) {
      return new Error('Load canceled');
    }
    return new Error('Resource failed to load, but the reason was not provided by devtools.');
  }
}

function areCookiesEqual(a: ICookie, b: ICookie): boolean {
  if ((a && !b) || (b && !a)) return false;
  if (a.name !== b.name) return false;
  if (a.value !== b.value) return false;
  if (a.expires !== b.expires) return false;
  if (a.path !== b.path) return false;
  if (a.secure !== b.secure) return false;
  if (a.sameParty !== b.sameParty) return false;
  if (a.httpOnly !== b.httpOnly) return false;
  return true;
}
