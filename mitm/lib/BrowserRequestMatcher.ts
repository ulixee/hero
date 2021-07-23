import ResourceType from '@ulixee/hero-interfaces/ResourceType';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@ulixee/commons/Resolvable';
import { IPuppetResourceRequest } from '@ulixee/hero-interfaces/IPuppetNetworkEvents';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import RequestSession from '../handlers/RequestSession';
import HeadersHandler from '../handlers/HeadersHandler';

const { log } = Log(module);

export default class BrowserRequestMatcher {
  public requestIdToTabId = new Map<string, number>();

  protected readonly logger: IBoundLog;

  private readonly requestedResources: IRequestedResource[] = [];

  constructor(requestSession: RequestSession) {
    this.logger = log.createChild(module, {
      sessionId: requestSession.sessionId,
    });
    requestSession.on('response', event => this.clearRequest(event.id));
  }

  public onMitmRequestedResource(mitmResource: IMitmRequestContext): IRequestedResource {
    let browserRequest = this.findMatchingRequest(mitmResource, 'noMitmResourceId');

    // if no request from browser (and unmatched), queue a new one
    if (!browserRequest) {
      browserRequest = {
        url: mitmResource.url.href,
        method: mitmResource.method,
        ...getHeaderDetails(mitmResource),
        isHttp2Push: mitmResource.isHttp2Push,
        mitmResourceId: mitmResource.id,
        requestTime: mitmResource.requestTime,
        browserRequestedPromise: new Resolvable(),
      };
      this.requestedResources.push(browserRequest);
    }

    browserRequest.mitmResourceId = mitmResource.id;

    const resolveTimeout = setTimeout(
      () =>
        this.logger.warn('BrowserRequestMatcher.ResourceNotResolved', {
          request: browserRequest,
        }),
      5e3,
    ).unref();

    const fetchDest = HeadersHandler.getRequestHeader(mitmResource, 'sec-fetch-dest');

    // NOTE: shared workers do not auto-register with chrome as of chrome 83, so we won't get a matching browserRequest
    if (fetchDest === 'sharedworker' || fetchDest === 'serviceworker') {
      browserRequest.browserRequestedPromise.resolve(null);
    }

    mitmResource.browserHasRequested = browserRequest.browserRequestedPromise.promise
      .then(() => {
        clearTimeout(resolveTimeout);
        // copy values to mitm resource
        if (!browserRequest?.browserRequestId) return;
        mitmResource.resourceType = browserRequest.resourceType;
        mitmResource.browserRequestId = browserRequest.browserRequestId;
        mitmResource.hasUserGesture = browserRequest.hasUserGesture;
        mitmResource.documentUrl = browserRequest.documentUrl;
        return null;
      })
      // drown errors - we don't want to log cancels
      .catch(() => clearTimeout(resolveTimeout));

    return browserRequest;
  }

  public onBrowserRequestedResourceExtraDetails(
    httpResourceLoad: IPuppetResourceRequest,
    tabId?: number,
  ): void {
    const match = this.requestedResources.find(
      x => x.browserRequestId === httpResourceLoad.browserRequestId,
    );
    if (!match) return;
    Object.assign(match, getHeaderDetails(httpResourceLoad));

    const mitmResourceNeedsResolve = this.findMatchingRequest(
      httpResourceLoad,
      'hasMitmResourceId',
    );
    if (mitmResourceNeedsResolve && !mitmResourceNeedsResolve.browserRequestedPromise.isResolved) {
      this.updatePendingResource(httpResourceLoad, mitmResourceNeedsResolve, tabId);
    }
  }

  public onBrowserRequestedResource(
    httpResourceLoad: IPuppetResourceRequest,
    tabId?: number,
  ): IRequestedResource {
    const { method } = httpResourceLoad;

    let resource = this.findMatchingRequest(httpResourceLoad);

    if (resource && resource.browserRequestedPromise.isResolved && resource.browserRequestId) {
      // figure out how long ago this request was
      const requestTimeDiff = Math.abs(
        httpResourceLoad.requestTime.getTime() - resource.requestTime.getTime(),
      );
      if (requestTimeDiff > 5e3) resource = null;
    }

    if (!resource) {
      if (!httpResourceLoad.url) return;
      resource = {
        url: httpResourceLoad.url.href,
        method,
        requestTime: httpResourceLoad.requestTime,
        browserRequestedPromise: new Resolvable(),
        ...getHeaderDetails(httpResourceLoad),
      } as IRequestedResource;
      this.requestedResources.push(resource);
    }

    this.updatePendingResource(httpResourceLoad, resource, tabId);

    return resource;
  }

  public onBrowserRequestFailed(event: {
    resource: IPuppetResourceRequest;
    tabId: number;
    loadError: Error;
  }): number {
    this.requestIdToTabId.set(event.resource.browserRequestId, event.tabId);
    const match =
      this.requestedResources.find(x => x.browserRequestId === event.resource.browserRequestId) ??
      this.findMatchingRequest(event.resource, 'hasMitmResourceId');
    if (match) {
      match.resourceType = event.resource.resourceType;
      match.browserRequestId = event.resource.browserRequestId;
      match.tabId = event.tabId;
      match.browserRequestedPromise.resolve();
      const id = match.mitmResourceId;
      if (id) setTimeout(() => this.clearRequest(id), 500).unref();
      return id;
    }
    this.logger.warn('BrowserViewOfResourceLoad::Failed', {
      ...event,
    });
  }

  public cancelPending(): void {
    for (const pending of this.requestedResources) {
      pending.browserRequestedPromise.reject(
        new CanceledPromiseError('Canceling: Mitm Request Session Closing'),
      );
    }
  }

  private updatePendingResource(
    httpResourceLoad: IPuppetResourceRequest,
    pendingResource: IRequestedResource,
    tabId: number,
  ): void {
    if (tabId) {
      pendingResource.tabId = tabId;
      this.requestIdToTabId.set(httpResourceLoad.browserRequestId, tabId);
    }
    pendingResource.browserRequestId = httpResourceLoad.browserRequestId;
    pendingResource.documentUrl = httpResourceLoad.documentUrl;
    pendingResource.resourceType = httpResourceLoad.resourceType;
    pendingResource.hasUserGesture = httpResourceLoad.hasUserGesture;
    pendingResource.browserRequestedPromise.resolve();
  }

  private clearRequest(resourceId: number): void {
    const matchIdx = this.requestedResources.findIndex(x => x.mitmResourceId === resourceId);
    if (matchIdx >= 0) this.requestedResources.splice(matchIdx, 1);
  }

  private findMatchingRequest(
    resourceToMatch: IPuppetResourceRequest,
    filter?: 'noMitmResourceId' | 'hasMitmResourceId',
  ): IRequestedResource | null {
    const { method } = resourceToMatch;
    const url = resourceToMatch.url?.href;
    if (!url) return;
    let matches = this.requestedResources.filter(x => {
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
}

function getHeaderDetails(
  httpResourceLoad: IPuppetResourceRequest,
): { origin: string; referer: string; secFetchDest: string; secFetchSite: string } {
  const origin = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'origin');
  const referer = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'referer');
  const secFetchDest = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'sec-fetch-dest');
  const secFetchSite = HeadersHandler.getRequestHeader<string>(httpResourceLoad, 'sec-fetch-site');
  return { origin, referer, secFetchDest, secFetchSite };
}

interface IRequestedResource {
  url: string;
  method: string;
  origin: string;
  secFetchSite: string;
  secFetchDest: string;
  referer: string;
  requestTime: Date;
  browserRequestedPromise: IResolvablePromise<void>;
  tabId?: number;
  mitmResourceId?: number;
  browserRequestId?: string;
  resourceType?: ResourceType;
  documentUrl?: string;
  hasUserGesture?: boolean;
  isHttp2Push?: boolean;
}
