import INavigation, {
  LoadStatus,
  NavigationReason,
  NavigationState,
} from '@secret-agent/core-interfaces/INavigation';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { createPromise } from '@secret-agent/commons/utils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
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

  private nextNavigationReason: { url: string; reason: NavigationReason };

  constructor(readonly frameId: string, readonly sessionState: SessionState) {
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
    browserRequestId?: string,
  ): void {
    const nextTop = <INavigation>{
      requestedUrl: url,
      finalUrl: null,
      frameId: this.frameId,
      startCommandId: commandId,
      navigationReason: reason,
      initiatedTime: new Date(),
      stateChanges: new Map(),
      resourceId: createPromise(),
      browserRequestId,
    };

    if (this.nextNavigationReason?.url === url) {
      nextTop.navigationReason = reason;
      this.nextNavigationReason = null;
    }

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
  }

  public onHttpRequested(
    url: string,
    lastCommandId: number,
    redirectedFromUrl: string,
    browserRequestId: string,
  ): void {
    if (url === 'about:blank') return;
    // if this is a redirect, capture in top
    if (this.top) {
      const top = this.top;
      if (redirectedFromUrl && redirectedFromUrl === (top.finalUrl ?? top.requestedUrl)) {
        this.changeNavigationState(LocationStatus.HttpRedirected, url);
      }
      // if we already have this status at top level, this is a new nav
      if (top.stateChanges.has(LocationStatus.HttpRequested) === true) {
        let reason: NavigationReason;
        if (redirectedFromUrl) reason = top.navigationReason;
        else if (url === (top.finalUrl ?? top.requestedUrl)) reason = 'reload';

        this.onNavigationRequested(reason ?? 'userGesture', url, lastCommandId, browserRequestId);
      }
    }

    // keep outside block for this.top since we might have a new top
    if (this.top && !this.top.browserRequestId) {
      this.top.browserRequestId = browserRequestId;
    }
    this.changeNavigationState(LocationStatus.HttpRequested);
  }

  public onHttpResponded(browserRequestId: string, url: string): void {
    if (url === 'about:blank') return;

    this.changeNavigationState(LocationStatus.HttpResponded, url);
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
    incomingStatus: NavigationState,
    url: string,
    statusChangeDate?: Date,
  ): void {
    if (url === 'about:blank') return;
    this.changeNavigationState(incomingStatus, url, statusChangeDate);
  }

  public updateNavigationReason(url: string, reason: NavigationReason): void {
    const top = this.top;
    if (!top) {
      this.nextNavigationReason = { url, reason };
      return;
    }
    if (top.requestedUrl === url || top.finalUrl === url) {
      top.navigationReason = reason;
      this.captureNavigationUpdate(top);
    }
  }

  private changeNavigationState(
    newStatus: NavigationState,
    finalUrl?: string,
    statusChangeDate?: Date,
  ): void {
    const top = this.top;
    if (!top) return;
    if (top.stateChanges.has(newStatus)) return;

    if (
      (newStatus === 'HttpResponded' || newStatus === 'HttpRedirected') &&
      !top.finalUrl &&
      finalUrl
    ) {
      top.finalUrl = finalUrl;
    }
    top.stateChanges.set(newStatus, statusChangeDate ?? new Date());

    this.emit('status-change', {
      url: top.finalUrl ?? top.requestedUrl,
      // @ts-ignore - Typescript refuses to recognize this function
      stateChanges: Object.fromEntries(top.stateChanges),
      newStatus,
    });
    this.captureNavigationUpdate(top);
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
