import INavigation, {
  NavigationReason,
  NavigationState,
} from '@secret-agent/core-interfaces/INavigation';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { createPromise } from '@secret-agent/commons/utils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import SessionDb from '../dbs/SessionDb';

interface TabNavigationEvents {
  'navigation-requested': INavigation;
  'status-change': {
    url: string;
    stateChanges: { [state: string]: Date };
    newStatus: NavigationState;
  };
}

const { log } = Log(module);

export default class TabNavigations extends TypedEventEmitter<TabNavigationEvents> {
  public get top(): INavigation {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  public get currentUrl(): string {
    const location = this.top;
    if (!location) return '';
    return location.finalUrl ?? location.requestedUrl;
  }

  public history: INavigation[] = [];

  public logger: IBoundLog;

  constructor(readonly db: SessionDb) {
    super();
    this.setEventsToLog(['navigation-requested', 'status-change']);
    this.logger = log.createChild(module, {
      sessionId: db.sessionId,
    });
  }

  public didGotoUrl(url: string): boolean {
    return this.history.some(x => x.requestedUrl === url && x.navigationReason === 'goto');
  }

  public onNavigationRequested(
    reason: NavigationReason,
    url: string,
    frameId: string,
    commandId: number,
    browserRequestId?: string,
  ): void {
    const entry = <INavigation>{
      requestedUrl: url,
      finalUrl: url,
      frameId,
      startCommandId: commandId,
      navigationReason: reason,
      initiatedTime: new Date(),
      stateChanges: new Map(),
      resourceId: createPromise(),
      browserRequestId,
    };

    const prevTop = this.top;
    // if in-page, set the state to match current top
    if (reason === 'inPage') {
      if (url === prevTop?.finalUrl) return;
      for (const [state] of prevTop?.stateChanges ?? []) {
        if (
          state === LocationStatus.DomContentLoaded ||
          state === 'ContentPaint' ||
          state === 'Load'
        ) {
          entry.stateChanges.set(state, new Date());
        }
      }
    }
    this.history.push(entry);

    this.emit('navigation-requested', entry);
    this.captureNavigationUpdate(entry);
  }

  public onHttpRequested(
    url: string,
    frameId: string,
    lastCommandId: number,
    redirectedFromUrl: string,
    browserRequestId: string,
  ): void {
    if (url === 'about:blank') return;
    // if this is a redirect, capture in top
    if (
      redirectedFromUrl &&
      (this.top?.requestedUrl === redirectedFromUrl || this.top?.finalUrl === redirectedFromUrl)
    ) {
      this.changeNavigationState(this.top, LocationStatus.HttpRedirected, url);
    }
    // if we already have this status at top level, this is a new nav
    if (this.top?.stateChanges.has(LocationStatus.HttpRequested) === true) {
      let reason: NavigationReason;
      if (redirectedFromUrl) reason = this.top.navigationReason;
      else if (url === this.currentUrl) reason = 'reload';

      this.onNavigationRequested(
        reason ?? 'userGesture',
        url,
        frameId,
        lastCommandId,
        browserRequestId,
      );
    }
    if (!this.top.browserRequestId) this.top.browserRequestId = browserRequestId;
    this.changeNavigationState(this.top, LocationStatus.HttpRequested, url);
  }

  public onHttpResponded(browserRequestId: string, url: string, frameId: string): void {
    if (url === 'about:blank') return;

    const top = this.top;
    if (top.frameId !== frameId) {
      this.logger.warn('onHttpResponded: Mismatched frame responded', { url, frameId, top });
      return;
    }
    top.finalUrl = url;
    this.changeNavigationState(top, LocationStatus.HttpResponded, url);
  }

  public onResourceLoaded(resourceId: number, statusCode: number, error?: Error): void {
    this.logger.info('NavigationResource resolved', {
      resourceId,
      statusCode,
      error,
      currentUrl: this.currentUrl,
    });
    if (!this.top || this.top.resourceId.isResolved) return;

    // since we don't know if there are listeners yet, we need to just set the error on the return value
    // otherwise, get unhandledrejections
    if (error) this.top.navigationError = error;

    this.top.resourceId.resolve(resourceId);
  }

  public onLoadStateChanged(
    incomingStatus: NavigationState,
    url: string,
    frameId: string,
    statusChangeDate?: Date,
  ): void {
    if (url === 'about:blank') return;

    const top = this.top;
    // only record main frame changes
    if (!top || top.frameId !== frameId) return;

    if (!top.stateChanges.has(incomingStatus)) {
      this.changeNavigationState(top, incomingStatus, url, statusChangeDate);
    }
  }

  public updateNavigationReason(frameId: string, url: string, reason: NavigationReason): void {
    const frameLifecycle = this.top;

    if (frameLifecycle.requestedUrl === url && frameLifecycle.frameId === frameId) {
      frameLifecycle.navigationReason = reason;
      this.captureNavigationUpdate(frameLifecycle);
    }
  }

  private changeNavigationState(
    navigation: INavigation,
    newStatus: NavigationState,
    finalUrl: string,
    statusChangeDate?: Date,
  ): void {
    if (finalUrl) navigation.finalUrl = finalUrl;
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
    this.db.frameNavigations.insert(navigation);
  }
}
