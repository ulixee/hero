import INavigation, { NavigationReason } from '@secret-agent/core-interfaces/INavigation';
import { IPipelineStatus, LocationStatus } from '@secret-agent/core-interfaces/Location';
import { createPromise } from '@secret-agent/commons/utils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import SessionDb from './SessionDb';

interface TabNavigationEvents {
  'navigation-requested': INavigation;
  'status-change': { navigation: INavigation; newStatus: IPipelineStatus };
}

const { log } = Log(module);

export default class TabNavigations extends TypedEventEmitter<TabNavigationEvents> {
  public get top() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  public get currentUrl() {
    const location = this.top;
    if (!location) return '';
    return location.finalUrl ?? location.requestedUrl;
  }

  public history: INavigation[] = [];

  protected logger: IBoundLog;

  constructor(readonly db: SessionDb) {
    super();
    this.setEventsToLog(['navigation-requested', 'status-change']);
    this.logger = log.createChild(module, {
      sessionId: db.sessionId,
    });
  }

  public resourceLoadedForLocation(resourceId: number, statusCode: number, error?: Error) {
    if (!this.top || this.top.resourceId.isResolved) return;
    if (statusCode >= 400 || error) {
      // since we don't know if there are listeners yet, we need to just set the error on the return value
      // otherwise, get unhandledrejections
      this.top.navigationError = error ?? new Error('Failed to load url');
    }
    this.top.resourceId.resolve(resourceId);
  }

  public didGotoUrl(url: string) {
    return this.history.some(x => x.requestedUrl === url && x.navigationReason === 'goto');
  }

  public navigationRequested(
    reason: NavigationReason,
    url: string,
    frameId: string,
    commandId: number,
  ) {
    const entry = {
      requestedUrl: url,
      finalUrl: url,
      frameId,
      startCommandId: commandId,
      navigationReason: reason,
      initiatedTime: new Date(),
      stateChanges: new Map<IPipelineStatus, Date>(),
      resourceId: createPromise(),
    } as INavigation;

    const prevTop = this.top;
    // if in-page, set the state to match current top
    if (reason === 'inPage') {
      if (url === prevTop?.finalUrl) return;
      for (const [state] of prevTop?.stateChanges ?? []) {
        if (state === LocationStatus.DomContentLoaded) entry.stateChanges.set(state, new Date());
        if (state === LocationStatus.AllContentLoaded) entry.stateChanges.set(state, new Date());
      }
    }
    this.history.push(entry);

    this.emit('navigation-requested', entry);
    this.captureNavigationUpdate(entry);
  }

  public triggerInPageNavigation(url: string, lastCommandId: number, frameId: string) {
    this.navigationRequested('inPage', url, frameId, lastCommandId);
  }

  public updatePipelineStatus(args: {
    incomingStatus: IPipelineStatus;
    url: string;
    frameId: string;
    lastCommandId: number;
    redirectedFromUrl?: string;
    requestInitiator?: NavigationReason;
  }) {
    const { url, incomingStatus } = args;
    if (url === 'about:blank') return;

    // if this is a redirect, capture in top
    if (args.redirectedFromUrl && this.top?.requestedUrl === args.redirectedFromUrl) {
      this.changePipelineStatus(this.top, LocationStatus.HttpRedirected, url);
    }

    // if we already have this status at top level, this is a new nav
    if (
      incomingStatus === LocationStatus.HttpRequested &&
      this.top?.stateChanges.has(LocationStatus.HttpRequested) === true
    ) {
      let reason = args.requestInitiator;
      if (!reason) {
        if (args.redirectedFromUrl) reason = this.top.navigationReason;
        else if (url === this.currentUrl) reason = 'reload';
        else reason = 'userGesture';
      }
      this.navigationRequested(reason, url, args.frameId, args.lastCommandId);
    }

    if (incomingStatus === LocationStatus.HttpResponded) {
      this.top.finalUrl = url;
    }

    this.changePipelineStatus(this.top, incomingStatus, url);
  }

  public updateNavigationReason(frameId: string, url: string, reason: NavigationReason) {
    const frameLifecycle = this.top;

    if (frameLifecycle.requestedUrl === url && frameLifecycle.frameId === frameId) {
      frameLifecycle.navigationReason = reason;
      this.captureNavigationUpdate(frameLifecycle);
    }
  }

  private changePipelineStatus(
    navigation: INavigation,
    newStatus: IPipelineStatus,
    finalUrl?: string,
  ) {
    this.emit('status-change', { navigation, newStatus });
    navigation.stateChanges.set(newStatus, new Date());
    if (finalUrl) navigation.finalUrl = finalUrl;
    this.captureNavigationUpdate(navigation);
  }

  private captureNavigationUpdate(navigation: INavigation) {
    this.db.frameNavigations.insert(navigation);
  }
}
