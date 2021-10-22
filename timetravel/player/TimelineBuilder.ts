import CommandTimeline from '../lib/CommandTimeline';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import { IFrameNavigationEvents } from '@ulixee/hero-core/lib/FrameNavigations';
import { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import { Session as HeroSession, Tab } from '@ulixee/hero-core';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';

export default class TimelineBuilder extends TypedEventEmitter<{
  updated: void;
}> {
  public static bySessionId = new Map<string, TimelineBuilder>();

  public commandTimeline: CommandTimeline;
  public recordScreenUntilTime = 0;
  public lastMetadata: ITimelineMetadata;

  public get sessionId(): string {
    return this.db.sessionId;
  }

  private timelineRange?: [startTime: number, endTime?: number];

  private isPaused = false;

  constructor(readonly db: SessionDb, readonly liveHeroSession?: HeroSession) {
    super();
    bindFunctions(this);
    TimelineBuilder.bySessionId.set(db.sessionId, this);
    this.commandTimeline = CommandTimeline.fromDb(this.db);

    if (liveHeroSession) {
      liveHeroSession.on('tab-created', this.onTabCreated);
      liveHeroSession.on('kept-alive', this.onHeroSessionPaused);
      liveHeroSession.on('resumed', this.onHeroSessionResumed);
      liveHeroSession.on('will-close', this.onHeroSessionWillClose);

      liveHeroSession.db.screenshots.subscribe(() => this.emit('updated'));
      liveHeroSession.once('closed', () => {
        liveHeroSession.off('tab-created', this.onTabCreated);
        liveHeroSession.db.screenshots.unsubscribe();
      });
    }
  }

  public setTimeRange(startTime: number, endTime?: number): void {
    this.timelineRange = [startTime, endTime];
    this.commandTimeline = this.liveHeroSession
      ? CommandTimeline.fromSession(this.liveHeroSession, this.timelineRange)
      : CommandTimeline.fromDb(this.db, this.timelineRange);
    this.refreshMetadata();
  }

  public getScreenshot(tabId: number, timestamp: number): string {
    const image = this.db.screenshots.getImage(tabId, timestamp);
    if (image) return image.toString('base64');
  }

  public refreshMetadata(): ITimelineMetadata {
    // update if live
    if (this.liveHeroSession) {
      this.commandTimeline = CommandTimeline.fromSession(this.liveHeroSession, this.timelineRange);
    }
    this.lastMetadata = TimelineBuilder.createTimelineMetadata(this.commandTimeline, this.db);
    return this.lastMetadata;
  }

  private onHeroSessionResumed(): void {
    this.isPaused = false;
    if (!this.liveHeroSession) return;

    for (const tab of this.liveHeroSession.tabsById.values()) {
      tab.recordScreen().catch(console.error);
    }
  }

  private onHeroSessionWillClose(event: { waitForPromise?: Promise<any> }): void {
    if (!this.recordScreenUntilTime) return;
    const delay = this.recordScreenUntilTime - Date.now();
    if (delay > 0) {
      event.waitForPromise = new Promise<void>(resolve => setTimeout(resolve, delay));
    }
  }

  private onHeroSessionPaused(): void {
    this.isPaused = true;
    if (!this.liveHeroSession) return;
    this.stopRecording();
  }

  private stopRecording(): void {
    for (const tab of this.liveHeroSession.tabsById.values()) {
      tab
        .stopRecording()
        .then(() => this.emit('updated'))
        .catch(console.error);
    }
  }

  private onTabCreated(event: { tab: Tab }): void {
    const tab = event.tab;
    tab.navigations.on('status-change', this.onStatusChange);
    tab.once('close', () => {
      tab.navigations.off('status-change', this.onStatusChange);
    });
    if (this.isPaused) return;

    tab.recordScreen().catch(console.error);
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

  public static createTimelineMetadata(
    commandTimeline: CommandTimeline,
    db: SessionDb,
  ): ITimelineMetadata {
    const mainFrameIds = db.frames.mainFrameIds();

    const urls: ITimelineMetadata['urls'] = [];

    const loadStatusLookups = [
      [LoadStatus.HttpRequested, 'Http Requested'],
      [LoadStatus.HttpResponded, 'Http Received'],
      [LoadStatus.DomContentLoaded, 'DOM Content Loaded'],
    ];

    for (const nav of commandTimeline.loadedNavigations) {
      if (!mainFrameIds.has(nav.frameId)) continue;

      urls.push({
        tabId: nav.tabId,
        url: nav.finalUrl ?? nav.requestedUrl,
        offsetPercent:
          urls.length === 0 ? 0 : commandTimeline.getTimelineOffsetForTimestamp(nav.initiatedTime),
        navigationId: nav.id,
        loadStatusOffsets: [],
      });
      const lastUrl = urls[urls.length - 1];

      for (const [loadStatus, name] of loadStatusLookups) {
        const timestamp = nav.statusChanges.get(loadStatus as LoadStatus);
        const offsetPercent = commandTimeline.getTimelineOffsetForTimestamp(timestamp);
        if (offsetPercent !== -1) {
          lastUrl.loadStatusOffsets.push({
            status: name,
            offsetPercent,
          });
        }
      }
    }

    const screenshots: ITimelineMetadata['screenshots'] = [];
    for (const [tabId, times] of db.screenshots.screenshotTimesByTabId) {
      for (const timestamp of times) {
        const offsetPercent = commandTimeline.getTimelineOffsetForTimestamp(timestamp);
        if (offsetPercent === -1) continue;
        screenshots.push({
          tabId,
          offsetPercent,
          timestamp,
        });
      }
    }

    const paintEvents: ITimelineMetadata['paintEvents'] = [];
    for (const [timestamp, domChanges] of db.domChanges.countByTimestamp) {
      const offsetPercent = commandTimeline.getTimelineOffsetForTimestamp(timestamp);
      if (offsetPercent === -1) continue;
      paintEvents.push({
        domChanges,
        offsetPercent,
      });
    }

    return {
      urls,
      screenshots,
      paintEvents,
    };
  }
}
