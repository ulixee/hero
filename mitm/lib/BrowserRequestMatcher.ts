import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IPuppetResourceRequest } from '@ulixee/hero-interfaces/IPuppetNetworkEvents';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
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

  public cancelPending(): void {
    for (const pending of this.requestedResources) {
      clearTimeout(pending.resolveTimeout);
      pending.browserRequestedPromise.reject(
        new CanceledPromiseError('Canceling: Mitm Request Session Closing'),
      );
    }
  }

  public onMitmRequestedResource(mitmResource: IHttpResourceLoadDetails): IRequestedResource {
    const pendingBrowserRequest =
      this.findMatchingRequest(mitmResource, 'noMitmResourceId') ??
      // if no request from browser (and unmatched), queue a new one
      this.queuePendingBrowserRequest(mitmResource);

    pendingBrowserRequest.mitmResourceId = mitmResource.id;

    // NOTE: shared workers do not auto-register with chrome as of chrome 83, so we won't get a matching browserRequest
    if (HeadersHandler.isWorkerDest(mitmResource, 'shared', 'service')) {
      pendingBrowserRequest.browserRequestedPromise.resolve(null);
    }

    mitmResource.browserHasRequested = pendingBrowserRequest.browserRequestedPromise.promise
      .then(
        this.copyBrowserRequestAttributesToResource.bind(this, mitmResource, pendingBrowserRequest),
      )
      .catch(() => clearTimeout(pendingBrowserRequest.resolveTimeout));

    return pendingBrowserRequest;
  }

  public onBrowserRequestedResourceExtraDetails(
    httpResourceLoad: IPuppetResourceRequest,
    tabId?: number,
    frameId?: number,
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
      this.updatePendingResource(httpResourceLoad, mitmResourceNeedsResolve, tabId, frameId);
    }
  }

  public onBrowserRequestedResource(
    httpResourceLoad: IPuppetResourceRequest,
    tabId?: number,
    frameId?: number,
  ): IRequestedResource {
    let pendingRequest = this.findMatchingRequest(httpResourceLoad);

    if (
      pendingRequest &&
      pendingRequest.browserRequestedPromise.isResolved &&
      pendingRequest.browserRequestId
    ) {
      // figure out how long ago this request was
      const requestTimeDiff = Math.abs(httpResourceLoad.requestTime - pendingRequest.requestTime);
      if (requestTimeDiff > 5e3) pendingRequest = null;
    }

    if (!pendingRequest) {
      if (!httpResourceLoad.url) return;
      pendingRequest = this.createPendingResource(httpResourceLoad);
    }

    this.updatePendingResource(httpResourceLoad, pendingRequest, tabId, frameId);

    return pendingRequest;
  }

  public onBrowserRequestFailed(event: {
    resource: IPuppetResourceRequest;
    tabId: number;
    frameId?: number;
    loadError: Error;
  }): number {
    this.requestIdToTabId.set(event.resource.browserRequestId, event.tabId);
    const pendingRequest =
      this.requestedResources.find(x => x.browserRequestId === event.resource.browserRequestId) ??
      this.findMatchingRequest(event.resource, 'hasMitmResourceId');
    if (pendingRequest) {
      this.updatePendingResource(event.resource, pendingRequest, event.tabId, event.frameId);
      const id = pendingRequest.mitmResourceId;
      if (id) setTimeout(() => this.clearRequest(id), 500).unref();
      return id;
    }
    this.logger.warn('BrowserViewOfResourceLoad::Failed', {
      ...event,
    });
  }

  private updatePendingResource(
    httpResourceLoad: IPuppetResourceRequest,
    browserRequest: IRequestedResource,
    tabId: number,
    frameId: number,
  ): void {
    if (tabId) {
      browserRequest.tabId = tabId;
      this.requestIdToTabId.set(httpResourceLoad.browserRequestId, tabId);
    }
    browserRequest.frameId ??= frameId;
    browserRequest.browserLoadedTime ??= httpResourceLoad.browserLoadedTime;
    browserRequest.browserRequestId = httpResourceLoad.browserRequestId;
    browserRequest.documentUrl = httpResourceLoad.documentUrl;
    browserRequest.resourceType = httpResourceLoad.resourceType;
    browserRequest.hasUserGesture = httpResourceLoad.hasUserGesture;
    browserRequest.browserRequestedPromise.resolve();
  }

  private copyBrowserRequestAttributesToResource(
    mitmResource: IHttpResourceLoadDetails,
    browserRequest: IRequestedResource,
  ): void {
    if (!browserRequest?.browserRequestId) return;
    clearTimeout(browserRequest.resolveTimeout);
    mitmResource.resourceType = browserRequest.resourceType;
    mitmResource.browserRequestId = browserRequest.browserRequestId;
    mitmResource.hasUserGesture = browserRequest.hasUserGesture;
    mitmResource.documentUrl = browserRequest.documentUrl;
    mitmResource.browserFrameId = browserRequest.frameId;
  }

  private clearRequest(resourceId: number): void {
    const matchIdx = this.requestedResources.findIndex(x => x.mitmResourceId === resourceId);
    if (matchIdx >= 0) this.requestedResources.splice(matchIdx, 1);
  }

  private createPendingResource(
    request: Pick<IHttpResourceLoadDetails, 'url' | 'method' | 'requestTime' | 'requestHeaders'>,
  ): IRequestedResource {
    const resource: IRequestedResource = {
      url: request.url.href,
      method: request.method,
      requestTime: request.requestTime,
      browserRequestedPromise: new Resolvable(),
      ...getHeaderDetails(request),
    } as IRequestedResource;
    this.requestedResources.push(resource);
    return resource;
  }

  private queuePendingBrowserRequest(mitmResource: IHttpResourceLoadDetails): IRequestedResource {
    const pendingRequest = this.createPendingResource(mitmResource);
    pendingRequest.mitmResourceId = mitmResource.id;
    pendingRequest.isHttp2Push = mitmResource.isHttp2Push;
    const toLog = {
      request: {
        url: pendingRequest.url,
        method: pendingRequest.method,
        id: pendingRequest.mitmResourceId,
      },
    };
    pendingRequest.resolveTimeout = setTimeout(() => {
      this.logger.warn('BrowserRequestMatcher.ResourceNotResolved', toLog);
      pendingRequest.browserRequestedPromise.reject(
        new Error('BrowserRequestMatcher.ResourceNotResolved'),
      );
    }, 5e3).unref();
    return pendingRequest;
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

interface IRequestedResource {
  url: string;
  method: string;
  origin: string;
  secFetchSite: string;
  secFetchDest: string;
  referer: string;
  requestTime: number;
  resolveTimeout?: NodeJS.Timeout;
  browserRequestedPromise: IResolvablePromise<void>;
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
