import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import { IFrameNavigationEvents } from '@ulixee/hero-core/lib/FrameNavigations';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import { Session, Tab } from '@ulixee/hero-core';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';

export default class TimelineRecorder extends TypedEventEmitter<{
  updated: void;
}> {
  public recordScreenUntilTime = 0;
  public recordScreenUntilLoad = false;
  private closeTimer: IResolvablePromise;
  private readonly events = new EventSubscriber();

  constructor(readonly heroSession: Session) {
    super();
    bindFunctions(this);

    this.events.on(heroSession, 'tab-created', this.onTabCreated);
    this.events.on(heroSession, 'will-close', this.onHeroSessionWillClose);
    this.events.on(heroSession, 'closed', this.close);
  }

  public close(): void {
    if (!this.heroSession) return;
    this.events.off();
    this.dontExtendSessionPastTime();
  }

  public dontExtendSessionPastTime(delayUntilTimestamp?: number): void {
    this.recordScreenUntilLoad = false;
    if (delayUntilTimestamp) {
      this.recordScreenUntilTime = delayUntilTimestamp ?? Date.now();
    }
    if (this.closeTimer) {
      const timer = this.closeTimer;
      const remainingMs = this.recordScreenUntilTime ? Date.now() - this.recordScreenUntilTime : 0;
      if (remainingMs > 0) {
        setTimeout(() => timer.resolve(), remainingMs).unref();
      } else {
        this.closeTimer.resolve();
      }
    }
  }

  private onHeroSessionWillClose(event: { waitForPromise?: Promise<any> }): void {
    if (!this.recordScreenUntilTime && !this.recordScreenUntilLoad) return;

    this.closeTimer?.resolve();

    let loadPromise: Promise<any>;
    if (this.recordScreenUntilLoad && this.heroSession) {
      loadPromise = Promise.all(
        [...this.heroSession.tabsById.values()].map(x => {
          return x.navigationsObserver.waitForLoad(LoadStatus.AllContentLoaded);
        }),
      );
    }

    const delay = this.recordScreenUntilTime - Date.now();
    let delayPromise: Promise<void>;
    if (delay > 0) {
      delayPromise = new Promise<void>(resolve => setTimeout(resolve, delay));
    }
    if (loadPromise || delayPromise) {
      this.closeTimer = new Resolvable<void>(60e3);

      Promise.all([loadPromise, delayPromise])
        .then(() => this.closeTimer.resolve())
        .catch(() => this.closeTimer.resolve());

      event.waitForPromise = this.closeTimer.promise;
    }
  }

  private onTabCreated(event: { tab: Tab }): void {
    const tab = event.tab;
    const statusChangeEvent = this.events.on(tab.navigations, 'status-change', this.onStatusChange);
    this.events.once(tab, 'close', () => this.events.off(statusChangeEvent));
  }

  private onStatusChange(status: IFrameNavigationEvents['status-change']): void {
    if (
      [
        LoadStatus.DomContentLoaded,
        LoadStatus.AllContentLoaded,
        ContentPaint,
        LoadStatus.JavascriptReady,
      ].includes(status.newStatus)
    ) {
      this.emit('updated');
    }
  }
}
