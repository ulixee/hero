import INavigation, {
  LoadStatus,
  NavigationReason,
  NavigationState,
} from '@ulixee/hero-interfaces/INavigation';
import { LocationStatus } from '@ulixee/hero-interfaces/Location';
import { createPromise } from '@ulixee/commons/utils';
import { TypedEventEmitter } from '@ulixee/commons/eventUtils';
import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import Log from '@ulixee/commons/Logger';
import SessionState from './SessionState';

interface IFrameNavigationEvents {
  'navigation-requested': INavigation;
  'status-change': {
    url: string;
    stateChanges: { [state: string]: Date };
    newStatus: NavigationState;
  };
}

const { log } = Log(module);

export default class FrameNavigations extends TypedEventEmitter<IFrameNavigationEvents> {
  public get top(): INavigation {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  public get currentUrl(): string {
    const top = this.top;
    if (!top) return '';
    return top.finalUrl ?? top.requestedUrl;
  }

  public history: INavigation[] = [];

  public logger: IBoundLog;

  private loaderIds = new Set<string>();

  private nextNavigationReason: { url: string; reason: NavigationReason };

  constructor(readonly frameId: number, readonly sessionState: SessionState) {
    super();
    this.setEventsToLog(['navigation-requested', 'status-change']);
    this.logger = log.createChild(module, {
      sessionId: sessionState.sessionId,
      frameId,
    });
  }

  public didGotoUrl(url: string): boolean {
    return this.history.some(x => x.requestedUrl === url && x.navigationReason === 'goto');
  }

  public onNavigationRequested(
    reason: NavigationReason,
    url: string,
    commandId: number,
    loaderId: string,
    browserRequestId?: string,
  ): INavigation {
    const nextTop = <INavigation>{
      requestedUrl: url,
      finalUrl: null,
      frameId: this.frameId,
      loaderId,
      startCommandId: commandId,
      navigationReason: reason,
      initiatedTime: new Date(),
      stateChanges: new Map(),
      resourceId: createPromise(),
      browserRequestId,
    };
    if (loaderId) this.loaderIds.add(loaderId);

    this.checkStoredNavigationReason(nextTop, url);

    const currentTop = this.top;
    // if in-page, set the state to match current top
    if (reason === 'inPage') {
      if (currentTop) {
        if (url === currentTop.finalUrl) return;

        for (const state of currentTop.stateChanges.keys()) {
          if (isLoadState(state)) {
            nextTop.stateChanges.set(state, new Date());
          }
        }
        nextTop.resourceId.resolve(currentTop.resourceId.promise);
      } else {
        nextTop.stateChanges.set(LoadStatus.Load, nextTop.initiatedTime);
        nextTop.stateChanges.set(LoadStatus.ContentPaint, nextTop.initiatedTime);
        nextTop.resourceId.resolve(-1);
      }
      nextTop.finalUrl = url;
    }
    this.history.push(nextTop);

    this.emit('navigation-requested', nextTop);
    this.captureNavigationUpdate(nextTop);
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
      top.stateChanges.has(LocationStatus.HttpRequested) === true &&
      // add new entries for redirects
      (!this.loaderIds.has(loaderId) || redirectedFromUrl)
    ) {
      this.onNavigationRequested(reason, url, lastCommandId, loaderId, browserRequestId);
    }

    this.changeNavigationState(LocationStatus.HttpRequested, loaderId);
  }

  public onHttpResponded(browserRequestId: string, url: string, loaderId: string): void {
    if (url === 'about:blank') return;

    const navigation = this.findMatchingNavigation(loaderId);
    navigation.finalUrl = url;

    this.recordStatusChange(navigation, LocationStatus.HttpResponded);
  }

  public onResourceLoaded(resourceId: number, statusCode: number, error?: Error): void {
    this.logger.info('NavigationResource resolved', {
      resourceId,
      statusCode,
      error,
      currentUrl: this.currentUrl,
    });
    const top = this.top;
    if (!top || top.resourceId.isResolved) return;

    // since we don't know if there are listeners yet, we need to just set the error on the return value
    // otherwise, get unhandledrejections
    if (error) top.navigationError = error;

    top.resourceId.resolve(resourceId);
  }

  public onLoadStateChanged(
    incomingStatus: LoadStatus.DomContentLoaded | LoadStatus.Load,
    url: string,
    loaderId: string,
    statusChangeDate?: Date,
  ): void {
    if (url === 'about:blank') return;
    this.changeNavigationState(incomingStatus, loaderId, statusChangeDate);
  }

  public updateNavigationReason(url: string, reason: NavigationReason): void {
    const top = this.top;
    if (
      top &&
      top.requestedUrl === url &&
      (top.navigationReason === null || top.navigationReason === 'newFrame')
    ) {
      top.navigationReason = reason;
      this.captureNavigationUpdate(top);
    } else {
      this.nextNavigationReason = { url, reason };
    }
  }

  public assignLoaderId(navigation: INavigation, loaderId: string, url?: string): void {
    if (!loaderId) return;
    this.loaderIds.add(loaderId);
    navigation.loaderId = loaderId;
    if (
      url &&
      (navigation.navigationReason === 'goBack' || navigation.navigationReason === 'goForward')
    ) {
      navigation.requestedUrl = url;
    }
    this.captureNavigationUpdate(navigation);
  }

  public getLastLoadedNavigation(): INavigation {
    let navigation: INavigation;
    for (let i = this.history.length - 1; i >= 0; i -= 1) {
      navigation = this.history[i];
      if (
        navigation.stateChanges.has(LoadStatus.DomContentLoaded) &&
        navigation.navigationReason !== 'inPage' &&
        !!navigation.finalUrl
      ) {
        return navigation;
      }
    }
    return this.top;
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
    const navigation = this.top;
    if (!navigation) return undefined;
    if (loaderId && navigation.loaderId && navigation.loaderId !== loaderId) {
      // find the right loader id
      for (let i = this.history.length - 1; i >= 0; i -= 1) {
        const nav = this.history[i];
        if (nav && nav.loaderId === loaderId) {
          return nav;
        }
      }
    }
    return navigation;
  }

  private recordRedirect(requestedUrl: string, finalUrl: string, loaderId: string): INavigation {
    const top = this.top;
    if (top.requestedUrl === requestedUrl && !top.finalUrl && !top.loaderId) {
      top.loaderId = loaderId;
      top.finalUrl = finalUrl;
      this.recordStatusChange(top, LocationStatus.HttpRedirected);
      return top;
    }

    // find the right loader id
    for (let i = this.history.length - 1; i >= 0; i -= 1) {
      const navigation = this.history[i];
      if (navigation && navigation.loaderId === loaderId) {
        if (
          !navigation.stateChanges.has(LocationStatus.HttpRedirected) &&
          navigation.requestedUrl === requestedUrl
        ) {
          navigation.finalUrl = finalUrl;
          this.recordStatusChange(navigation, LocationStatus.HttpRedirected);
          return navigation;
        }
      }
    }
  }

  private changeNavigationState(
    newStatus: NavigationState,
    loaderId?: string,
    statusChangeDate?: Date,
  ): void {
    const navigation = this.findMatchingNavigation(loaderId);
    if (!navigation) return;
    if (navigation.stateChanges.has(newStatus)) return;

    this.recordStatusChange(navigation, newStatus, statusChangeDate);
    if (loaderId) this.loaderIds.add(loaderId);
  }

  private recordStatusChange(
    navigation: INavigation,
    newStatus: NavigationState,
    statusChangeDate?: Date,
  ): void {
    navigation.stateChanges.set(newStatus, statusChangeDate ?? new Date());

    this.emit('status-change', {
      url: navigation.finalUrl ?? navigation.requestedUrl,
      // @ts-ignore - Typescript refuses to recognize this function
      stateChanges: Object.fromEntries(navigation.stateChanges),
      newStatus,
    });
    this.captureNavigationUpdate(navigation);
  }

  private captureNavigationUpdate(navigation: INavigation): void {
    this.sessionState.recordNavigation(navigation);
  }
}

function isLoadState(status: NavigationState): boolean {
  return (
    status === LoadStatus.ContentPaint ||
    status === LoadStatus.Load ||
    status === LoadStatus.DomContentLoaded
  );
}
