import INavigation, { NavigationReason } from '@secret-agent/core-interfaces/INavigation';
import { IPipelineStatus, LocationStatus } from '@secret-agent/core-interfaces/Location';
import { createPromise } from '@secret-agent/commons/utils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import SessionDb from './SessionDb';

interface TabNavigationEvents {
  'navigation-requested': INavigation;
  'status-change': { navigation: INavigation; newStatus: IPipelineStatus };
}

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

  constructor(readonly db: SessionDb) {
    super();
    this.setEventsToLog(['navigation-requested', 'status-change'], 'tab:navigation');
  }

  public resourceLoadedForLocation(resourceId: number) {
    if (!this.top || this.top.resourceId.isResolved) return;
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

  public updatePipelineStatus(
    incomingStatus: IPipelineStatus,
    url: string,
    frameId: string,
    lastCommandId: number,
  ) {
    if (url === 'about:blank') return;
    if (
      incomingStatus === LocationStatus[LocationStatus.HttpRequested] &&
      this.top?.stateChanges.has(incomingStatus) === true
    ) {
      const reason = url === this.currentUrl ? 'reload' : 'userGesture';
      this.navigationRequested(reason, url, frameId, lastCommandId);
    }
    const navigation = this.top;
    this.emit('status-change', { navigation, newStatus: incomingStatus });

    navigation.stateChanges.set(incomingStatus, new Date());
    if (
      incomingStatus === LocationStatus[LocationStatus.HttpResponded] ||
      incomingStatus === LocationStatus[LocationStatus.HttpRedirected]
    ) {
      navigation.finalUrl = url;
    }
    this.captureNavigationUpdate(navigation);
  }

  public updateNavigationReason(frameId: string, url: string, reason: NavigationReason) {
    const frameLifecycle = this.top;

    if (frameLifecycle.requestedUrl === url && frameLifecycle.frameId === frameId) {
      frameLifecycle.navigationReason = reason;
      this.captureNavigationUpdate(frameLifecycle);
    }
  }

  private captureNavigationUpdate(navigation: INavigation) {
    this.db.frameNavigations.insert(navigation);
  }
}
