import IPage, { NavigationReason } from '@secret-agent/core-interfaces/IPage';
import { IPipelineStatus, LocationStatus } from '@secret-agent/core-interfaces/Location';
import { createPromise } from '@secret-agent/commons/utils';
import SessionDb from './SessionDb';

export default class PageHistory {
  public get top() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  public get currentUrl() {
    const location = this.top;
    if (!location) return '';
    return location.finalUrl ?? location.requestedUrl;
  }

  public onNewPage: (urlState: IPage) => any;
  public onPagePipelineStatusChange: (page: IPage, newStatus: IPipelineStatus) => any;
  public history: IPage[] = [];

  private idCounter = 0;

  constructor(readonly db: SessionDb) {}

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
      id: this.idCounter += 1,
      requestedUrl: url,
      finalUrl: url,
      frameId,
      startCommandId: commandId,
      navigationReason: reason,
      initiatedTime: new Date().toISOString(),
      stateChanges: new Map<IPipelineStatus, Date>(),
      resourceId: createPromise(),
    } as IPage;

    const prevTop = this.top;
    // if in-page, set the state to match current top
    if (reason === 'inPage') {
      for (const [state, date] of prevTop?.stateChanges ?? []) {
        if (state === LocationStatus.DomContentLoaded) entry.stateChanges.set(state, new Date());
        if (state === LocationStatus.AllContentLoaded) entry.stateChanges.set(state, new Date());
      }
    }
    this.history.push(entry);

    if (this.onNewPage) this.onNewPage(entry);
    this.captureLocationUpdate(entry);
  }

  public triggerInPageNavigation(url: string, lastCommandId: number, frameId: string) {
    this.navigationRequested('inPage', url, frameId, lastCommandId);
  }

  public update(
    incomingStatus: IPipelineStatus,
    url: string,
    frameId: string,
    lastCommandId: number,
  ) {
    if (
      incomingStatus === LocationStatus[LocationStatus.HttpRequested] &&
      this.top?.stateChanges.has(incomingStatus)
    ) {
      const reason = url === this.currentUrl ? 'reload' : 'userGesture';
      this.navigationRequested(reason, url, frameId, lastCommandId);
    }
    const page = this.top;
    if (this.onPagePipelineStatusChange) this.onPagePipelineStatusChange(page, incomingStatus);

    page.stateChanges.set(incomingStatus, new Date());
    if (
      incomingStatus === LocationStatus[LocationStatus.HttpResponded] ||
      incomingStatus === LocationStatus[LocationStatus.HttpRedirected]
    ) {
      page.finalUrl = url;
    }
    this.captureLocationUpdate(page);
  }

  public updateNavigationReason(frameId: string, url: string, reason: NavigationReason) {
    const page = this.top;

    if (page.requestedUrl === url && page.frameId === frameId) {
      page.navigationReason = reason;
      this.captureLocationUpdate(page);
    }
  }

  private captureLocationUpdate(page: IPage) {
    this.db.pages.insert(page);
  }
}
