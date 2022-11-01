import INavigation, {
  ContentPaint,
  NavigationStatus,
} from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { NavigationReason } from '@ulixee/unblocked-specification/agent/browser/NavigationReason';
import { createPromise } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import {
  IDomPaintEvent,
  ILoadStatus,
  LoadStatus,
} from '@ulixee/unblocked-specification/agent/browser/Location';
import {
  IFrameNavigationEvents,
  IFrameNavigations,
} from '@ulixee/unblocked-specification/agent/browser/IFrameNavigations';
import Frame from './Frame';

export default class FrameNavigations
  extends TypedEventEmitter<IFrameNavigationEvents>
  implements IFrameNavigations
{
  public get top(): INavigation {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  // last navigation not loaded in-page
  public lastHttpNavigationRequest: INavigation;

  public get currentUrl(): string {
    const top = this.top;
    if (!top) return '';
    return top.finalUrl ?? top.requestedUrl;
  }

  public history: INavigation[] = [];
  public initiatedUserAction: { startCommandId: number; reason: NavigationReason };

  public logger: IBoundLog;

  private readonly historyByLoaderId: { [loaderId: string]: INavigation } = {};
  private readonly historyById: Record<number, INavigation> = {};
  private nextNavigationReason: { url: string; reason: NavigationReason };

  constructor(readonly frame: Frame, logger: IBoundLog) {
    super();
    this.logger = logger.createChild(module);
    this.setEventsToLog(this.logger, ['navigation-requested', 'status-change']);
  }

  public reset(): void {
    for (const entry of this.history) {
      delete this.historyByLoaderId[entry.loaderId];
      delete this.historyById[entry.id];
    }
    this.lastHttpNavigationRequest = null;
    this.initiatedUserAction = null;
    this.nextNavigationReason = null;
    this.history.length = 0;
  }

  public get(id: number): INavigation {
    return this.historyById[id];
  }

  public didGotoUrl(url: string): boolean {
    return this.history.some(x => x.requestedUrl === url && x.navigationReason === 'goto');
  }

  public hasLoadStatus(status: ILoadStatus): boolean {
    if (!this.top) return false;

    const statuses = this.top.statusChanges;

    if (statuses.has(status)) {
      return true;
    }

    if (status === LoadStatus.JavascriptReady) {
      return statuses.has(LoadStatus.AllContentLoaded) || this.top.finalUrl === 'about:blank';
    }

    if (status === LoadStatus.DomContentLoaded) {
      return statuses.has(LoadStatus.DomContentLoaded) || statuses.has(LoadStatus.AllContentLoaded);
    }

    if (status === LoadStatus.PaintingStable) {
      return this.getPaintStableStatus().isStable;
    }

    return false;
  }

  public getPaintStableStatus(): { isStable: boolean; timeUntilReadyMs?: number } {
    const top = this.top;
    if (!top) return { isStable: false };

    // need to wait for both load + painting stable, or wait 3 seconds after either one
    const loadDate = top.statusChanges.get(LoadStatus.AllContentLoaded);
    const contentPaintedDate = top.statusChanges.get(ContentPaint);

    if (contentPaintedDate) return { isStable: true };
    if (!loadDate && !contentPaintedDate) return { isStable: false };

    // NOTE: LargestContentfulPaint, which currently drives PaintingStable will NOT trigger if the page
    // doesn't have any "contentful" items that are eligible (image, headers, divs, paragraphs that fill the page)

    // have contentPaintedDate date, but no load
    const timeUntilReadyMs = Date.now() - (contentPaintedDate ?? loadDate);
    return {
      isStable: timeUntilReadyMs >= 3e3,
      timeUntilReadyMs: Math.min(3e3, 3e3 - timeUntilReadyMs),
    };
  }

  public onNavigationRequested(
    reason: NavigationReason,
    url: string,
    commandId: number,
    loaderId: string,
    browserRequestId?: string,
  ): INavigation {
    let nextTop: INavigation;
    if (this.currentUrl === url && this.top.loaderId === 'NO_LOADER_ASSIGNED') {
      nextTop = this.top;
      nextTop.loaderId = loaderId;
      nextTop.browserRequestId = browserRequestId;
    } else {
      nextTop = <INavigation>{
        id: (this.frame.page.browserContext.idTracker.navigationId += 1),
        documentNavigationId: this.lastHttpNavigationRequest?.id,
        tabId: this.frame.page.tabId,
        requestedUrl: url,
        finalUrl: null,
        frameId: this.frame.frameId,
        loaderId,
        startCommandId: commandId,
        navigationReason: reason,
        initiatedTime: Date.now(),
        statusChanges: new Map(),
        resourceIdResolvable: createPromise(),
        browserRequestId,
      };
      nextTop.resourceIdResolvable.promise
        .then(this.resolveResourceId.bind(this, nextTop))
        .catch(() => null);
      this.history.push(nextTop);
      this.historyById[nextTop.id] = nextTop;
    }
    if (loaderId) this.historyByLoaderId[loaderId] = nextTop;

    this.checkStoredNavigationReason(nextTop, url);
    if (this.initiatedUserAction) {
      nextTop.navigationReason = this.initiatedUserAction.reason;
      nextTop.startCommandId = this.initiatedUserAction.startCommandId;
      this.initiatedUserAction = null;
    }

    let shouldPublishLocationChange = false;
    // if in-page, set the state to match current top
    if (reason === 'inPage') {
      if (this.top?.finalUrl === url) return;
      const lastHttpResponse = this.lastHttpNavigationRequest;
      if (lastHttpResponse) {
        for (const state of lastHttpResponse.statusChanges.keys()) {
          if (isPageLoadedStatus(state)) {
            nextTop.statusChanges.set(state, Date.now());
          }
        }
        nextTop.resourceIdResolvable.resolve(lastHttpResponse.resourceIdResolvable.promise);
      } else {
        nextTop.statusChanges.set(LoadStatus.AllContentLoaded, nextTop.initiatedTime);
        nextTop.statusChanges.set(ContentPaint, nextTop.initiatedTime);
        nextTop.resourceIdResolvable.resolve(-1);
      }
      shouldPublishLocationChange = true;
      nextTop.finalUrl = url;
    } else {
      let isStillSameHttpPage = false;
      if (nextTop.requestedUrl?.includes('#') && this.lastHttpNavigationRequest) {
        const baseUrl = (
          this.lastHttpNavigationRequest.finalUrl ?? this.lastHttpNavigationRequest.requestedUrl
        ).split('#')[0];
        isStillSameHttpPage = nextTop.requestedUrl.startsWith(baseUrl);
      }
      if (!isStillSameHttpPage) {
        nextTop.documentNavigationId = null;
        this.lastHttpNavigationRequest = nextTop;
      }
    }

    this.emit('navigation-requested', nextTop);
    this.emit('change', { navigation: nextTop });
    if (shouldPublishLocationChange) {
      this.emit('status-change', {
        id: nextTop.id,
        newStatus: ContentPaint,
        url,
        // @ts-ignore
        statusChanges: Object.fromEntries(nextTop.statusChanges),
      });
    }
    return nextTop;
  }

  public onHttpRequested(
    url: string,
    lastCommandId: number,
    redirectedFromUrl: string,
    browserRequestId: string,
    loaderId: string,
  ): void {
    // if this is a redirect, capture in top
    if (!this.top) return;

    let reason: NavigationReason;
    if (redirectedFromUrl) {
      const redirectedNavigation = this.recordRedirect(redirectedFromUrl, url, loaderId);
      reason = redirectedNavigation?.navigationReason;
    }

    const top = this.top;

    const isHistoryNavigation =
      top.navigationReason === 'goBack' || top.navigationReason === 'goForward';
    if (!top.requestedUrl && isHistoryNavigation) {
      top.requestedUrl = url;
    } else if (
      !top.requestedUrl &&
      top.navigationReason === 'newFrame' &&
      top.loaderId === loaderId
    ) {
      top.requestedUrl = url;
      this.checkStoredNavigationReason(top, url);
    }
    // if we already have this status at top level, this is a new nav
    else if (
      top.statusChanges.has(LoadStatus.HttpRequested) === true &&
      // add new entries for redirects
      (!this.historyByLoaderId[loaderId] || redirectedFromUrl)
    ) {
      this.onNavigationRequested(reason, url, lastCommandId, loaderId, browserRequestId);
    }

    this.changeNavigationStatus(LoadStatus.HttpRequested, loaderId);
  }

  public onDomPaintEvent(
    event: IDomPaintEvent,
    url: string,
    timestamp: number,
    didRetry = false,
  ): void {
    // only record the content paint
    if (event === 'LargestContentfulPaint') {
      this.onLoadStatusChanged(ContentPaint as any, url, null, timestamp);
    } else if (event === 'FirstContentfulPaint') {
      const contentPaintHistory = this.findMostRecentHistory(x => x.finalUrl === url);
      if (contentPaintHistory?.statusChanges?.has(LoadStatus.JavascriptReady)) {
        this.logger.warn('JavascriptReady received for navigation already ready', {
          timestamp,
          url,
          contentPaintHistory,
        });
      } else if (contentPaintHistory) {
        this.setPageReady(contentPaintHistory, timestamp);
      } else if (!didRetry) {
        setTimeout(() => this.onDomPaintEvent(event, url, timestamp, true), 100);
      }
    }
  }

  public adjustInPageLocationChangeTime(navigation: INavigation, timestamp: number): void {
    navigation.initiatedTime = timestamp;
    // if we already have dom content loaded, update to the new timestamp
    if (navigation.statusChanges.has(LoadStatus.DomContentLoaded)) {
      navigation.statusChanges.set(LoadStatus.DomContentLoaded, timestamp);
      navigation.statusChanges.set(LoadStatus.AllContentLoaded, timestamp);
    }
  }

  public setPageReady(navigation: INavigation, timestamp: number): void {
    this.recordStatusChange(navigation, LoadStatus.JavascriptReady, timestamp);
  }

  public onHttpResponded(
    browserRequestId: string,
    url: string,
    loaderId: string,
    responseTime: number,
  ): void {
    const navigation = this.findMatchingNavigation(loaderId);
    if (!navigation) {
    }
    navigation.finalUrl = url;

    this.recordStatusChange(navigation, LoadStatus.HttpResponded, responseTime);
  }

  public doesMatchPending(
    browserRequestId: string,
    requestedUrl: string,
    finalUrl: string,
    loaderId?: string,
  ): boolean {
    const top = this.lastHttpNavigationRequest;
    if (!top || top.resourceIdResolvable.isResolved) return false;
    if (loaderId && top.loaderId !== loaderId) return false;
    if (browserRequestId && top.browserRequestId && browserRequestId !== top.browserRequestId)
      return false;

    // hash won't be in the http request
    const frameRequestedUrl = top.requestedUrl?.split('#')?.shift();

    if ((top.finalUrl && finalUrl === top.finalUrl) || requestedUrl === frameRequestedUrl) {
      return true;
    }
    return false;
  }

  public onResourceLoaded(resourceId: number, statusCode: number, error?: Error): void {
    this.logger.info('NavigationResource resolved', {
      resourceId,
      statusCode,
      error,
      currentUrl: this.currentUrl,
    });
    const top = this.lastHttpNavigationRequest;

    if (!top || top.resourceIdResolvable.isResolved) return;

    // since we don't know if there are listeners yet, we need to just set the error on the return value
    // otherwise, get unhandledrejections
    if (error) top.navigationError = error;
    top.resourceIdResolvable.resolve(resourceId);
  }

  public onLoadStatusChanged(
    incomingStatus:
      | LoadStatus.DomContentLoaded
      | LoadStatus.AllContentLoaded
      | LoadStatus.PaintingStable,
    url: string,
    loaderId: string,
    statusChangeDate?: number,
  ): void {
    // if this is a painting stable, it won't come from a loader event for the page
    if (!loaderId) {
      loaderId = this.findMostRecentHistory(
        nav =>
          (nav.finalUrl === url || nav.requestedUrl === url) &&
          nav.statusChanges.has(LoadStatus.HttpResponded),
      )?.loaderId;
    }
    this.changeNavigationStatus(incomingStatus, loaderId, statusChangeDate);
  }

  public updateNavigationReason(url: string, reason: NavigationReason): void {
    const top = this.top;
    if (
      top &&
      top.requestedUrl === url &&
      (top.navigationReason === null || top.navigationReason === 'newFrame')
    ) {
      top.navigationReason = reason;
      this.emit('change', { navigation: top });
    } else {
      this.nextNavigationReason = { url, reason };
    }
  }

  public assignLoaderId(navigation: INavigation, loaderId: string): void {
    if (!loaderId) {
      navigation.loaderId = 'NO_LOADER_ASSIGNED';
      return;
    }
    this.historyByLoaderId[loaderId] ??= navigation;
    navigation.loaderId = loaderId;
    this.emit('change', { navigation });
  }

  public getLastLoadedNavigation(): INavigation {
    let navigation: INavigation;
    let hasInPageNav = false;
    for (let i = this.history.length - 1; i >= 0; i -= 1) {
      navigation = this.history[i];
      if (navigation.navigationReason === 'inPage') {
        hasInPageNav = true;
        continue;
      }
      if (!navigation.finalUrl || !navigation.statusChanges.has(LoadStatus.HttpResponded)) continue;

      // if we have an in-page nav, return the first non "inPage" url. Otherwise, use if we loaded html
      if (hasInPageNav || navigation.statusChanges.has(LoadStatus.DomContentLoaded)) {
        return navigation;
      }
    }
    return this.top;
  }

  public findMostRecentHistory(callback: (history: INavigation) => boolean): INavigation {
    for (let i = this.history.length - 1; i >= 0; i -= 1) {
      const navigation = this.history[i];
      if (callback(navigation)) return navigation;
    }
  }

  private checkStoredNavigationReason(navigation: INavigation, url: string): void {
    if (
      this.nextNavigationReason &&
      this.nextNavigationReason.url === url &&
      (!navigation.navigationReason || navigation.navigationReason === 'newFrame')
    ) {
      navigation.navigationReason = this.nextNavigationReason.reason;
      this.nextNavigationReason = null;
    }
  }

  private findMatchingNavigation(loaderId: string): INavigation {
    return this.historyByLoaderId[loaderId] ?? this.top;
  }

  private recordRedirect(requestedUrl: string, finalUrl: string, loaderId: string): INavigation {
    const top = this.top;
    if (top.requestedUrl === requestedUrl && !top.finalUrl && !top.loaderId) {
      top.loaderId = loaderId;
      top.finalUrl = finalUrl;
      this.recordStatusChange(top, LoadStatus.HttpRedirected);
      return top;
    }

    // find the right loader id
    const navigation = this.findMostRecentHistory(
      x =>
        x.loaderId === loaderId &&
        !x.statusChanges.has(LoadStatus.HttpRedirected) &&
        x.requestedUrl === requestedUrl,
    );
    if (navigation) {
      navigation.finalUrl = finalUrl;
      this.recordStatusChange(navigation, LoadStatus.HttpRedirected);
      return navigation;
    }
  }

  private changeNavigationStatus(
    newStatus: NavigationStatus,
    loaderId?: string,
    statusChangeDate?: number,
  ): void {
    const navigation = this.findMatchingNavigation(loaderId);
    if (!navigation) return;
    if (!navigation.loaderId && loaderId) {
      navigation.loaderId = loaderId;
      this.historyByLoaderId[loaderId] ??= navigation;
    }
    if (navigation.statusChanges.has(newStatus)) {
      if (statusChangeDate && statusChangeDate < navigation.statusChanges.get(newStatus)) {
        navigation.statusChanges.set(newStatus, statusChangeDate);
      }
      return;
    }

    this.recordStatusChange(navigation, newStatus, statusChangeDate);
  }

  private resolveResourceId(navigation: INavigation, resourceId: number): void {
    navigation.resourceId = resourceId;
    this.emit('change', { navigation });
  }

  private recordStatusChange(
    navigation: INavigation,
    newStatus: NavigationStatus,
    statusChangeDate?: number,
  ): void {
    navigation.statusChanges.set(newStatus, statusChangeDate ?? Date.now());

    this.emit('status-change', {
      id: navigation.id,
      url: navigation.finalUrl ?? navigation.requestedUrl,
      // @ts-ignore - Typescript refuses to recognize this function
      statusChanges: Object.fromEntries(navigation.statusChanges),
      newStatus,
    });
    this.emit('change', { navigation });
  }
}

function isPageLoadedStatus(status: NavigationStatus): boolean {
  return (
    status === ContentPaint ||
    status === LoadStatus.AllContentLoaded ||
    status === LoadStatus.DomContentLoaded
  );
}
