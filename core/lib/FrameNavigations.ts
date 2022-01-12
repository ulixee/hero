import INavigation, {
  ContentPaint,
  NavigationReason,
  NavigationStatus,
} from '@ulixee/hero-interfaces/INavigation';
import { createPromise } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import { ILoadStatus, LoadStatus } from '@ulixee/hero-interfaces/Location';
import FrameNavigationsTable from '../models/FrameNavigationsTable';

export interface IFrameNavigationEvents {
  'navigation-requested': INavigation;
  'status-change': {
    id: number;
    url: string;
    statusChanges: Record<NavigationStatus, number>;
    newStatus: NavigationStatus;
  };
}

const { log } = Log(module);

export default class FrameNavigations extends TypedEventEmitter<IFrameNavigationEvents> {
  public get top(): INavigation {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  // last navigation not loaded in-page
  public lastHttpNavigation: INavigation;

  public get currentUrl(): string {
    const top = this.top;
    if (!top) return '';
    return top.finalUrl ?? top.requestedUrl;
  }

  public history: INavigation[] = [];

  public logger: IBoundLog;

  private readonly historyByLoaderId: { [loaderId: string]: INavigation } = {};
  private readonly historyById: Record<number, INavigation> = {};

  private nextNavigationReason: { url: string; reason: NavigationReason };

  constructor(
    readonly tabId: number,
    readonly frameId: number,
    readonly sessionId: string,
    readonly model: FrameNavigationsTable,
  ) {
    super();
    this.setEventsToLog(['navigation-requested', 'status-change']);
    this.logger = log.createChild(module, {
      sessionId: this.sessionId,
      frameId,
    });
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
    const nextTop = <INavigation>{
      id: (this.model.idCounter += 1),
      tabId: this.tabId,
      requestedUrl: url,
      finalUrl: null,
      frameId: this.frameId,
      loaderId,
      startCommandId: commandId,
      navigationReason: reason,
      initiatedTime: Date.now(),
      statusChanges: new Map(),
      resourceIdResolvable: createPromise(),
      browserRequestId,
    };
    nextTop.resourceIdResolvable.promise.then(x => (nextTop.resourceId = x)).catch(() => null);
    if (loaderId) this.historyByLoaderId[loaderId] = nextTop;

    this.checkStoredNavigationReason(nextTop, url);

    const currentTop = this.top;
    let shouldPublishLocationChange = false;
    // if in-page, set the state to match current top
    if (reason === 'inPage') {
      if (currentTop) {
        if (url === currentTop.finalUrl) return;

        for (const state of currentTop.statusChanges.keys()) {
          if (isPageLoadedStatus(state)) {
            nextTop.statusChanges.set(state, Date.now());
          }
        }
        nextTop.resourceIdResolvable.resolve(currentTop.resourceIdResolvable.promise);
      } else {
        nextTop.statusChanges.set(LoadStatus.AllContentLoaded, nextTop.initiatedTime);
        nextTop.statusChanges.set(ContentPaint, nextTop.initiatedTime);
        nextTop.resourceIdResolvable.resolve(-1);
      }
      shouldPublishLocationChange = true;
      nextTop.finalUrl = url;
    } else {
      this.lastHttpNavigation = nextTop;
    }
    this.history.push(nextTop);
    this.historyById[nextTop.id] = nextTop;

    this.emit('navigation-requested', nextTop);
    this.model.insert(nextTop);
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
    if (url === 'about:blank') return;
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

  public onHttpResponded(
    browserRequestId: string,
    url: string,
    loaderId: string,
    responseTime: number,
  ): void {
    if (url === 'about:blank') return;

    const navigation = this.findMatchingNavigation(loaderId);
    navigation.finalUrl = url;

    this.recordStatusChange(navigation, LoadStatus.HttpResponded, responseTime);
  }

  public doesMatchPending(
    browserRequestId: string,
    requestedUrl: string,
    finalUrl: string,
  ): boolean {
    const top = this.lastHttpNavigation;
    if (!top || top.resourceIdResolvable.isResolved) return false;

    // hash won't be in the http request
    const frameRequestedUrl = top.requestedUrl?.split('#')?.shift();

    if (
      (top.finalUrl && finalUrl === top.finalUrl) ||
      requestedUrl === frameRequestedUrl ||
      browserRequestId === top.browserRequestId
    ) {
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
    const top = this.lastHttpNavigation;

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
    if (url === 'about:blank') return;
    // if this is a painting stable, it won't come from a loader event for the page
    if (!loaderId) {
      loaderId = this.findHistory(
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
      this.model.insert(top);
    } else {
      this.nextNavigationReason = { url, reason };
    }
  }

  public assignLoaderId(navigation: INavigation, loaderId: string, url?: string): void {
    if (!loaderId) return;
    this.historyByLoaderId[loaderId] ??= navigation;
    navigation.loaderId = loaderId;
    if (
      url &&
      (navigation.navigationReason === 'goBack' || navigation.navigationReason === 'goForward')
    ) {
      navigation.requestedUrl = url;
    }
    this.model.insert(navigation);
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

  public findHistory(callback: (history: INavigation) => boolean): INavigation {
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
    const navigation = this.findHistory(
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
    this.model.insert(navigation);
  }
}

function isPageLoadedStatus(status: NavigationStatus): boolean {
  return (
    status === ContentPaint ||
    status === LoadStatus.AllContentLoaded ||
    status === LoadStatus.DomContentLoaded
  );
}
