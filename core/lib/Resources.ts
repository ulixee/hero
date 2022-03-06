import {
  IRequestSessionHttpErrorEvent,
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
} from '@ulixee/hero-mitm/handlers/RequestSession';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import MitmRequestContext from '@ulixee/hero-mitm/lib/MitmRequestContext';
import { IPuppetResourceRequest } from '@ulixee/hero-interfaces/IPuppetNetworkEvents';
import ResourcesTable from '../models/ResourcesTable';
import Session from './Session';
import { ICookie } from '@ulixee/hero-interfaces/ICookie';
import { Cookie } from 'tough-cookie';
import StorageChangesTable, { IStorageChangesEntry } from '../models/StorageChangesTable';
import { IPuppetPageEvents } from '@ulixee/hero-interfaces/IPuppetPage';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
import HeadersHandler from '@ulixee/hero-mitm/handlers/HeadersHandler';
import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import Tab from './Tab';

const { log } = Log(module);

export default class Resources {
  public readonly browserRequestIdToResources = new Map<string, IResourceMeta[]>();

  public readonly resourcesById = new Map<number, IResourceMeta>();
  public readonly cookiesByDomain = new Map<string, Record<string, ICookie>>();

  private readonly browserRequestIdToTabId = new Map<string, number>();
  private readonly mitmErrorsByUrl = new Map<
    string,
    {
      resourceId: number;
      event: IRequestSessionHttpErrorEvent;
    }[]
  >();

  private readonly mitmRequestsPendingBrowserRequest: IMitmRequestPendingBrowserRequest[] = [];
  private readonly logger: IBoundLog;
  private readonly model: ResourcesTable;
  private readonly cookiesModel: StorageChangesTable;

  constructor(private session: Session) {
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
    resource.seenAtCommandId = atCommandId;
    this.get(resource.id).seenAtCommandId = atCommandId;
  }

  public registerWebsocketHeaders(
    tabId: number,
    event: IPuppetPageEvents['websocket-handshake'],
  ): void {
    this.browserRequestIdToTabId.set(event.browserRequestId, tabId);
    this.session.mitmRequestSession?.registerWebsocketHeaders(tabId, event);
  }

  public cleanup(): void {
    this.mitmRequestsPendingBrowserRequest.length = 0;
    this.mitmErrorsByUrl.clear();
    this.resourcesById.clear();
    this.cookiesByDomain.clear();
    this.browserRequestIdToResources.clear();
    this.session = null;
  }

  public cancelPending(): void {
    for (const pending of this.mitmRequestsPendingBrowserRequest) {
      if (pending.browserRequestedPromise.isResolved) continue;
      pending.browserRequestedPromise.reject(
        new CanceledPromiseError('Canceling: Mitm Request Session Closing'),
      );
    }
    this.mitmRequestsPendingBrowserRequest.length = 0;
  }

  /////// BROWSER REQUEST ID MAPPING ///////////////////////////////////////////////////////////////////////////////////

  public getBrowserRequestTabId(browserRequestId: string): number {
    return this.browserRequestIdToTabId.get(browserRequestId);
  }

  public getBrowserRequestLatestResource(browserRequestId: string): IResourceMeta {
    const resources = this.browserRequestIdToResources.get(browserRequestId);
    if (!resources?.length) {
      return;
    }

    return resources[resources.length - 1];
  }

  public trackBrowserRequestToResourceId(browserRequestId: string, resource: IResourceMeta): void {
    if (!browserRequestId) return;
    // NOTE: browserRequestId can be shared amongst redirects
    let resources = this.browserRequestIdToResources.get(browserRequestId);
    if (!resources) {
      resources = this.browserRequestIdToResources.set(browserRequestId, []).get(browserRequestId);
    }
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
    if (this.browserRequestIdToResources.has(resourceRequest.browserRequestId)) return;

    const ctx = MitmRequestContext.createFromPuppetResourceRequest(resourceRequest);
    const resourceDetails = MitmRequestContext.toEmittedResource(ctx);
    resourceDetails.frameId = frameId;
    if (!resourceRequest.browserServedFromCache) {
      resourceDetails.body = await getBody();
      if (resourceDetails.body) {
        delete resourceDetails.response.headers['content-encoding'];
        delete resourceDetails.response.headers['Content-Encoding'];
      }
    }
    return this.record(tabId, resourceDetails, true);
  }

  /////// BROWSER REQUESTS /////////////////////////////////////////////////////////////////////////////////////////////

  public onBrowserWillRequest(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
  ): IMitmRequestPendingBrowserRequest {
    this.browserRequestIdToTabId.set(resource.browserRequestId, tabId);
    let pendingRequest = this.findMatchingRequest(resource);

    if (
      pendingRequest &&
      pendingRequest.browserRequestedPromise.isResolved &&
      pendingRequest.browserRequestId
    ) {
      // figure out how long ago this request was
      const requestTimeDiff = Math.abs(resource.requestTime - pendingRequest.requestTime);
      if (requestTimeDiff > 5e3) pendingRequest = null;
    }

    if (!pendingRequest) {
      if (!resource.url) return;
      pendingRequest = this.createPendingResource(resource);
    }

    this.updatePendingResource(resource, pendingRequest, tabId, frameId);

    return pendingRequest;
  }

  public onBrowserDidRequest(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
  ): void {
    this.browserRequestIdToTabId.set(resource.browserRequestId, tabId);

    const pendingRequest = this.mitmRequestsPendingBrowserRequest.find(
      x => x.browserRequestId === resource.browserRequestId,
    );
    if (pendingRequest) {
      Object.assign(pendingRequest, getHeaderDetails(resource));
    }

    const mitmResourceNeedsResolve = this.findMatchingRequest(resource, 'hasMitmResourceId');
    if (mitmResourceNeedsResolve && !mitmResourceNeedsResolve.browserRequestedPromise.isResolved) {
      this.updatePendingResource(resource, mitmResourceNeedsResolve, tabId, frameId);
    }
  }

  public onBrowserResourceLoaded(tabId: number, resource: IPuppetResourceRequest): boolean {
    const knownResource = this.getBrowserRequestLatestResource(resource.browserRequestId);
    if (knownResource) {
      if (!knownResource.response) {
        const ctx = MitmRequestContext.createFromPuppetResourceRequest(resource);
        const resourceDetails = MitmRequestContext.toEmittedResource(ctx);
        knownResource.response = resourceDetails.response;
      }
      knownResource.response.browserLoadedTime = resource.browserLoadedTime;
      this.model.updateReceivedTime(knownResource.id, resource.browserLoadedTime);
      return true;
    }

    return this.matchesMitmError(
      tabId,
      resource.url.href,
      resource.method,
      resource.browserRequestId,
      resource.requestTime,
    );
  }

  public onBrowserRequestFailed(
    tabId: number,
    frameId: number,
    resource: IPuppetResourceRequest,
    loadError: Error,
  ): IResourceMeta {
    this.browserRequestIdToTabId.set(resource.browserRequestId, tabId);

    const pendingRequest =
      this.mitmRequestsPendingBrowserRequest.find(
        x => x.browserRequestId === resource.browserRequestId,
      ) ?? this.findMatchingRequest(resource, 'hasMitmResourceId');

    let resourceId: number;
    if (pendingRequest) {
      this.updatePendingResource(resource, pendingRequest, tabId, frameId);
      resourceId = pendingRequest.mitmResourceId;
      if (resourceId) setTimeout(() => this.requestIsResolved(resourceId), 500).unref();
    }
    resourceId ??= this.getBrowserRequestLatestResource(resource.browserRequestId)?.id;

    // this function will resolve any pending resourceId for a navigation
    return this.recordFailed(
      tabId,
      MitmRequestContext.toEmittedResource({ id: resourceId, ...resource } as any),
      loadError,
    );
  }

  /////// MITM REQUESTS ////////////////////////////////////////////////////////////////////////////////////////////////

  public onMitmRequest(request: IRequestSessionRequestEvent): void {
    this.logger.info('MitmRequest', {
      url: request.url.href,
      method: request.request.method,
      id: request.id,
    });
    // don't know the tab id at this point
    this.record(null, request, false);
  }

  public determineResourceType(mitmResource: IHttpResourceLoadDetails): void {
    const pendingBrowserRequest =
      this.findMatchingRequest(mitmResource, 'noMitmResourceId') ??
      // if no request from browser (and unmatched), queue a new one
      this.createPendingResource(mitmResource);

    pendingBrowserRequest.mitmResourceId = mitmResource.id;
    pendingBrowserRequest.isHttp2Push = mitmResource.isHttp2Push;

    // NOTE: shared workers do not auto-register with chrome as of chrome 83, so we won't get a matching browserRequest
    if (
      HeadersHandler.isWorkerDest(mitmResource, 'shared', 'service') ||
      mitmResource.resourceType === 'Websocket'
    ) {
      pendingBrowserRequest.browserRequestedPromise.resolve(null);
    }

    mitmResource.browserHasRequested = pendingBrowserRequest.browserRequestedPromise.promise
      .then(() => {
        // eslint-disable-next-line promise/always-return
        if (!pendingBrowserRequest?.browserRequestId) return;
        mitmResource.resourceType = pendingBrowserRequest.resourceType;
        mitmResource.browserRequestId = pendingBrowserRequest.browserRequestId;
        mitmResource.hasUserGesture = pendingBrowserRequest.hasUserGesture;
        mitmResource.documentUrl = pendingBrowserRequest.documentUrl;
        mitmResource.browserFrameId = pendingBrowserRequest.frameId;
      })
      .catch(() => null);
  }

  public onMitmRequestError(
    tabId: number,
    event: IRequestSessionHttpErrorEvent,
    error: Error,
  ): IResourceMeta {
    const request = event.request;
    const resource = this.resourceEventToMeta(tabId, request);
    this.model.insert(tabId, resource, null, request.postData, request, error);

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

  public onMitmResponse(response: IRequestSessionResponseEvent, defaultTab: Tab): IResourceMeta {
    const tabId = this.getBrowserRequestTabId(response.browserRequestId);
    const resource = this.record(tabId ?? defaultTab?.id, response, true);
    this.requestIsResolved(resource.id);
    return resource;
  }

  private requestIsResolved(resourceId: number): void {
    const matchIdx = this.mitmRequestsPendingBrowserRequest.findIndex(
      x => x.mitmResourceId === resourceId,
    );
    if (matchIdx >= 0) this.mitmRequestsPendingBrowserRequest.splice(matchIdx, 1);
  }

  /////// STORAGE //////////////////////////////////////////////////////////////////////////////////////////////////////

  private record(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
    isResponse: boolean,
  ): IResourceMeta {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    const resourceResponseEvent = resourceEvent as IRequestSessionResponseEvent;

    this.model.insert(
      tabId,
      resource,
      resourceResponseEvent.postData,
      resourceResponseEvent.body,
      resourceEvent,
    );

    if (isResponse) {
      this.resourcesById.set(resource.id, resource);

      const responseEvent = resourceEvent as IRequestSessionResponseEvent;
      this.recordCookies(tabId, responseEvent);
    }
    return resource;
  }

  private recordFailed(
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
        this.model.insert(
          tabId,
          convertedMeta,
          resourceFailedEvent.postData,
          null,
          resourceFailedEvent,
          error,
        );
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

  /////// MITM <-> BROWSER MATCHING ////////////////////////////////////////////////////////////////////////////////////

  private updatePendingResource(
    httpResourceLoad: IPuppetResourceRequest,
    browserRequest: IMitmRequestPendingBrowserRequest,
    tabId: number,
    frameId: number,
  ): void {
    browserRequest.tabId ??= tabId;
    browserRequest.frameId ??= frameId;
    browserRequest.browserLoadedTime ??= httpResourceLoad.browserLoadedTime;
    browserRequest.browserRequestId = httpResourceLoad.browserRequestId;
    browserRequest.documentUrl = httpResourceLoad.documentUrl;
    browserRequest.resourceType = httpResourceLoad.resourceType;
    browserRequest.hasUserGesture = httpResourceLoad.hasUserGesture;
    browserRequest.browserRequestedPromise.resolve();
  }

  private createPendingResource(
    request: Pick<IHttpResourceLoadDetails, 'url' | 'method' | 'requestTime' | 'requestHeaders'>,
  ): IMitmRequestPendingBrowserRequest {
    const resource: IMitmRequestPendingBrowserRequest = {
      url: request.url.href,
      method: request.method,
      requestTime: request.requestTime,
      browserRequestedPromise: new Resolvable(
        5e3,
        `BrowserRequestMatcher.ResourceNotResolved: ${request.method}: ${request.url}`,
      ),
      ...getHeaderDetails(request),
    } as IMitmRequestPendingBrowserRequest;
    this.mitmRequestsPendingBrowserRequest.push(resource);
    return resource;
  }

  private findMatchingRequest(
    resourceToMatch: IPuppetResourceRequest,
    filter?: 'noMitmResourceId' | 'hasMitmResourceId',
  ): IMitmRequestPendingBrowserRequest | null {
    const { method } = resourceToMatch;
    const url = resourceToMatch.url?.href;
    if (!url) return;
    let matches = this.mitmRequestsPendingBrowserRequest.filter(x => {
      return x.url === url && x.method === method;
    });

    if (resourceToMatch.browserRequestId) {
      matches = matches.filter(x => {
        if (x.browserRequestId) return x.browserRequestId === resourceToMatch.browserRequestId;
        return true;
      });
    }

    if (filter === 'noMitmResourceId') {
      matches = matches.filter(x => !x.mitmResourceId);
    }
    if (filter === 'hasMitmResourceId') {
      matches = matches.filter(x => !!x.mitmResourceId);
    }

    // if http2 push, we don't know what referer/origin headers the browser will use
    // NOTE: we do this because it aligns the browserRequestId. We don't need header info
    const h2Push = matches.find(x => x.isHttp2Push);
    if (h2Push) return h2Push;
    if (resourceToMatch.isHttp2Push && matches.length) return matches[0];

    if (method === 'OPTIONS') {
      const origin = HeadersHandler.getRequestHeader(resourceToMatch, 'origin');
      return matches.find(x => x.origin === origin);
    }

    // if we have sec-fetch-dest headers, make sure they match
    const secDest = HeadersHandler.getRequestHeader(resourceToMatch, 'sec-fetch-dest');
    if (secDest) {
      matches = matches.filter(x => x.secFetchDest === secDest);
    }
    // if we have sec-fetch-dest headers, make sure they match
    const secSite = HeadersHandler.getRequestHeader(resourceToMatch, 'sec-fetch-site');
    if (secSite) {
      matches = matches.filter(x => x.secFetchSite === secSite);
    }

    if (matches.length === 1) return matches[0];
    // otherwise, use referer
    const referer = HeadersHandler.getRequestHeader(resourceToMatch, 'referer');
    return matches.find(x => x.referer === referer);
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

function getHeaderDetails(httpResourceLoad: Pick<IHttpResourceLoadDetails, 'requestHeaders'>): {
  origin: string;
  referer: string;
  secFetchDest: string;
  secFetchSite: string;
} {
  const origin = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'origin');
  const referer = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'referer');
  const secFetchDest = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'sec-fetch-dest');
  const secFetchSite = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'sec-fetch-site');
  return { origin, referer, secFetchDest, secFetchSite };
}

interface IMitmRequestPendingBrowserRequest {
  url: string;
  method: string;
  origin: string;
  secFetchSite: string;
  secFetchDest: string;
  referer: string;
  requestTime: number;
  browserRequestedPromise: Resolvable<void>;
  tabId?: number;
  frameId?: number;
  mitmResourceId?: number;
  browserLoadedTime?: number;
  browserRequestId?: string;
  resourceType?: IResourceType;
  documentUrl?: string;
  hasUserGesture?: boolean;
  isHttp2Push?: boolean;
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
