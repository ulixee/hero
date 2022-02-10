import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import { IFrameNavigationEvents } from '@ulixee/hero-core/lib/FrameNavigations';
import { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import { Session, Tab } from '@ulixee/hero-core';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import {
  addTypedEventListeners,
  removeEventListeners,
  TypedEventEmitter,
  addTypedEventListener,
} from '@ulixee/commons/lib/eventUtils';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';

export default class TimelineRecorder extends TypedEventEmitter<{
  updated: void;
}> {
  public recordScreenUntilTime = 0;
  public recordScreenUntilLoad = false;
  private closeTimer: IResolvablePromise;
  private readonly registeredEvents: IRegisteredEventListener[];

  constructor(readonly heroSession: Session) {
    super();
    bindFunctions(this);

    this.registeredEvents = addTypedEventListeners(heroSession, [
      ['tab-created', this.onTabCreated],
      ['kept-alive', this.onHeroSessionPaused],
      ['will-close', this.onHeroSessionWillClose],
      [
        'closed',
        () => {
          heroSession.off('tab-created', this.onTabCreated);
        },
      ],
    ]);
  }

  public stop(): void {
    if (!this.heroSession) return;
    removeEventListeners(this.registeredEvents);
    this.stopRecording();
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

  public stopRecording(): void {
    for (const tab of this.heroSession.tabsById.values()) {
      tab
        .stopRecording()
        .then(() => this.emit('updated'))
        .catch(console.error);
    }
  }

  public getScreenshot(tabId: number, timestamp: number): string {
    const image = this.heroSession.db.screenshots.getImage(tabId, timestamp);
    if (image) return image.toString('base64');
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

  private onHeroSessionPaused(): void {
    if (!this.heroSession) return;
    this.stopRecording();
  }

  private onTabCreated(event: { tab: Tab }): void {
    const tab = event.tab;
    this.registeredEvents.push(
      addTypedEventListener(tab.navigations, 'status-change', this.onStatusChange),
      addTypedEventListener(tab, 'close', () => {
        tab.navigations.off('status-change', this.onStatusChange);
      }),
    );
  }

  private onStatusChange(status: IFrameNavigationEvents['status-change']): void {
    if (
      [LoadStatus.DomContentLoaded, LoadStatus.AllContentLoaded, ContentPaint].includes(
        status.newStatus,
      )
    ) {
      this.emit('updated');
    }
  }
}
