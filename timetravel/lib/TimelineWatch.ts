import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { ContentPaint } from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { Session, Tab } from '@ulixee/hero-core';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import Log from '@ulixee/commons/lib/Logger';
import { IFrameNavigationEvents } from '@ulixee/unblocked-specification/agent/browser/IFrameNavigations';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';

const { log } = Log(module);

export default class TimelineWatch extends TypedEventEmitter<{
  updated: void;
}> {
  private closeTimer: IResolvablePromise;
  private readonly events = new EventSubscriber();
  private extendTimelineUntilTimestamp: number;
  private logger: IBoundLog;

  constructor(
    readonly heroSession: Session,
    readonly timelineExtenders?: {
      extendAfterCommands?: number;
      extendAfterLoadStatus?: { status: LoadStatus; msAfterStatus: number };
    },
  ) {
    super();
    bindFunctions(this);
    this.logger = log.createChild(module, { sessionId: heroSession.id });

    this.events.on(heroSession, 'tab-created', this.onTabCreated);
    this.events.on(heroSession, 'will-close', this.onHeroSessionWillClose);
    this.events.on(heroSession.commands, 'finish', this.onCommandFinish);
    this.events.on(heroSession, 'closed', this.close);
  }

  public close(): void {
    if (!this.heroSession) return;
    this.events.off();
    this.closeTimer?.resolve();
  }

  private onCommandFinish(command: ICommandMeta): void {
    if (this.timelineExtenders.extendAfterCommands) {
      this.extendTimelineUntilTimestamp =
        command.endDate + this.timelineExtenders.extendAfterCommands;
    }
  }

  private onHeroSessionWillClose(event: { waitForPromise?: Promise<any> }): void {
    if (!this.timelineExtenders) return;

    this.closeTimer?.resolve();

    let loadPromise: Promise<any>;
    const { extendAfterLoadStatus } = this.timelineExtenders;
    if (extendAfterLoadStatus) {
      const { status, msAfterStatus } = extendAfterLoadStatus;
      const promises: Promise<any>[] = [];
      for (const tab of this.heroSession.tabsById.values()) {
        if (!tab.navigations.hasLoadStatus(status)) {
          this.logger.info('Delaying session close until page has load status.', {
            status,
            tabId: tab.id,
          });
          promises.push(
            tab.navigationsObserver
              .waitForLoad(status)
              .then(() => new Promise(resolve => setTimeout(resolve, msAfterStatus))),
          );
        }
      }
      loadPromise = Promise.all(promises);
    }

    const delay = this.extendTimelineUntilTimestamp
      ? this.extendTimelineUntilTimestamp - Date.now()
      : 0;
    let delayPromise: Promise<void>;
    if (delay > 0) {
      this.logger.info(`Delaying session close for ${delay}ms after last command.`);
      delayPromise = new Promise<void>(resolve => setTimeout(resolve, delay));
    }
    if (loadPromise || delayPromise) {
      this.closeTimer = new Resolvable<void>(60e3);
      const { resolve } = this.closeTimer;

      Promise.all([loadPromise, delayPromise]).then(resolve).catch(resolve);

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
