import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@secret-agent/commons/Resolvable';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import RequestSession from '../handlers/RequestSession';

const { log } = Log(module);

export default class BrowserRequestMatcher {
  public requestIdToTabId = new Map<string, string>();

  protected readonly logger: IBoundLog;

  private readonly requestedResources: IRequestedResource[] = [];

  constructor(requestSession: RequestSession) {
    this.logger = log.createChild(module, {
      sessionId: requestSession.sessionId,
    });
    requestSession.on('response', event => this.clearRequest(event.id));
  }

  public onMitmRequestedResource(mitmResource: IMitmRequestContext): void {
    let browserRequest = this.findMatchingRequest(mitmResource, 'noMitmResourceId');

    // if no request from browser (and unmatched), queue a new one
    if (!browserRequest) {
      browserRequest = {
        url: mitmResource.url.href,
        method: mitmResource.method,
        headers: mitmResource.requestLowerHeaders,
        isHttp2Push: mitmResource.isHttp2Push,
        mitmResourceId: mitmResource.id,
        requestTime: mitmResource.requestTime,
        browserRequestedPromise: new Resolvable(),
      };
      this.requestedResources.push(browserRequest);
    }

    browserRequest.mitmResourceId = mitmResource.id;
    const hasUserActivity =
      !!mitmResource.requestLowerHeaders['sec-fetch-user'] || mitmResource.hasUserGesture;

    // NOTE: shared workers do not auto-register with chrome as of chrome 83, so we won't get a matching browserRequest
    const isSharedWorker = mitmResource.requestLowerHeaders['sec-fetch-dest'] === 'sharedworker';

    let resolveTimeout: NodeJS.Timeout;
    if (!isSharedWorker) {
      resolveTimeout = setTimeout(
        () =>
          this.logger.warn('BrowserRequestMatcher.ResourceNotResolved', {
            request: browserRequest,
          }),
        5e3,
      ).unref();
    }
    mitmResource.browserHasRequested = browserRequest.browserRequestedPromise.promise
      .then(async () => {
        clearTimeout(resolveTimeout);
        // copy values to mitm resource
        mitmResource.resourceType = browserRequest.resourceType;
        mitmResource.browserRequestId = browserRequest.browserRequestId;
        mitmResource.hasUserGesture = browserRequest.hasUserGesture;
        mitmResource.documentUrl = browserRequest.documentUrl;

        const onFirstPartyInteraction =
          mitmResource.requestSession.networkInterceptorDelegate?.http
            .onOriginHasFirstPartyInteraction;

        if (onFirstPartyInteraction && hasUserActivity) {
          await onFirstPartyInteraction(browserRequest.documentUrl);
        }
        return null;
      })
      // drown errors - we don't want to log cancels
      .catch(() => clearTimeout(resolveTimeout));
  }

  public onBrowserRequestedResourceExtraDetails(
    httpResourceLoad: IHttpResourceLoadDetails,
    tabId?: string,
  ): void {
    const match = this.requestedResources.find(
      x => x.browserRequestId === httpResourceLoad.browserRequestId,
    );
    if (!match) return;
    Object.assign(match.headers, httpResourceLoad.requestLowerHeaders);

    const mitmResourceNeedsResolve = this.findMatchingRequest(
      httpResourceLoad,
      'hasMitmResourceId',
    );
    if (mitmResourceNeedsResolve && !mitmResourceNeedsResolve.browserRequestedPromise.isResolved) {
      this.updatePendingResource(httpResourceLoad, mitmResourceNeedsResolve, tabId);
    }
  }

  public onBrowserRequestedResource(
    httpResourceLoad: IHttpResourceLoadDetails,
    tabId?: string,
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
      resource = {
        url: httpResourceLoad.url.href,
        method,
        requestTime: httpResourceLoad.requestTime,
        headers: httpResourceLoad.requestLowerHeaders,
        browserRequestedPromise: new Resolvable(),
      } as IRequestedResource;
      this.requestedResources.push(resource);
    }

    this.updatePendingResource(httpResourceLoad, resource, tabId);

    return resource;
  }

  public onBrowserRequestFailed(event: {
    resource: IHttpResourceLoadDetails;
    tabId: string;
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
      if (id) this.clearRequest(id);
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
    httpResourceLoad: IHttpResourceLoadDetails,
    pendingResource: IRequestedResource,
    tabId: string,
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
    resourceToMatch: IHttpResourceLoadDetails,
    filter?: 'noMitmResourceId' | 'hasMitmResourceId',
  ): IRequestedResource | null {
    const { method } = resourceToMatch;
    const url = resourceToMatch.url.href;
    let matches = this.requestedResources.filter(x => {
      return x.url === url && x.method === method;
    });

    if (filter === 'noMitmResourceId') {
      matches = matches.filter(x => {
        return x.mitmResourceId === null || x.mitmResourceId === undefined;
      });
    }
    if (filter === 'hasMitmResourceId') {
      matches = matches.filter(x => {
        return x.mitmResourceId !== null && x.mitmResourceId !== undefined;
      });
    }

    const headers = resourceToMatch.requestLowerHeaders ?? {};

    // if http2 push, we don't know what referer/origin headers the browser will use
    // NOTE: we do this because it aligns the browserRequestId. We don't need header info
    const h2Push = matches.find(x => x.isHttp2Push);
    if (h2Push) return h2Push;
    if (resourceToMatch.isHttp2Push && matches.length) return matches[0];

    if (method === 'OPTIONS') {
      return matches.find(x => x.headers.origin === headers.origin);
    }

    // if we have sec-fetch-dest headers, make sure they match
    const secDest = headers['sec-fetch-dest'];
    if (secDest) {
      matches = matches.filter(x => secDest === x.headers['sec-fetch-dest']);
    }
    // if we have sec-fetch-dest headers, make sure they match
    const secSite = headers['sec-fetch-site'];
    if (secSite) {
      matches = matches.filter(x => secSite === x.headers['sec-fetch-site']);
    }

    if (matches.length === 1) return matches[0];
    // otherwise, use referer
    return matches.find(x => x.headers.referer === headers.referer);
  }
}

interface IRequestedResource {
  url: string;
  method: string;
  headers: IResourceHeaders;
  requestTime: Date;
  browserRequestedPromise: IResolvablePromise<void>;
  tabId?: string;
  mitmResourceId?: number;
  browserRequestId?: string;
  resourceType?: ResourceType;
  documentUrl?: string;
  hasUserGesture?: boolean;
  isHttp2Push?: boolean;
}
