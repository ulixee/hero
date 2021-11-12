import CommandTimeline from '../lib/CommandTimeline';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import { IFrameNavigationEvents } from '@ulixee/hero-core/lib/FrameNavigations';
import { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import { Session, Tab } from '@ulixee/hero-core';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';

export default class TimelineBuilder extends TypedEventEmitter<{
  updated: void;
}> {
  public static bySessionId = new Map<string, TimelineBuilder>();

  public commandTimeline: CommandTimeline;
  public recordScreenUntilTime = 0;
  public recordScreenUntilLoad = false;
  public lastMetadata: ITimelineMetadata;

  public get sessionId(): string {
    return this.db.sessionId;
  }

  public get timelineRange(): [startTime: number, endTime?: number] {
    return this._timelineRange;
  }

  public set timelineRange(value) {
    this._timelineRange = value;
    // need to refresh from db. RefreshMetadata will update live
    if (!this.liveSession) {
      this.commandTimeline = CommandTimeline.fromDb(this.db, this.timelineRange);
    }
    this.refreshMetadata();
  }

  private _timelineRange: [startTime: number, endTime?: number];
  private isPaused = false;
  private liveSession?: Session;

  constructor(readonly db: SessionDb, timelineRange?: TimelineBuilder['_timelineRange']) {
    super();
    bindFunctions(this);
    TimelineBuilder.bySessionId.set(db.sessionId, this);
    this._timelineRange = timelineRange;
    this.commandTimeline = CommandTimeline.fromDb(this.db, this._timelineRange);
    if (db.sessionId === 'eB3F-gYGfTj_a72wvcqmj') {
      console.log(
        {
          startTime: this.commandTimeline.startTime,
          endTime: this.commandTimeline.endTime,
          runtime: this.commandTimeline.runtimeMs,
        },
        ...this.commandTimeline.commands.map(x => {
          return {
            ...x,
            result: undefined,
            args: undefined,
            reusedCommandFromRun: undefined,
            resultType: undefined,
          };
        }),
      );
    }
  }

  public trackLiveSession(liveSession: Session): void {
    if (this.liveSession) return;
    this.liveSession = liveSession;
    liveSession.on('tab-created', this.onTabCreated);
    liveSession.on('kept-alive', this.onHeroSessionPaused);
    liveSession.on('resumed', this.onHeroSessionResumed);
    liveSession.on('will-close', this.onHeroSessionWillClose);

    liveSession.db.screenshots.subscribe(() => this.emit('updated'));
    liveSession.once('closed', () => {
      liveSession.off('tab-created', this.onTabCreated);
      liveSession.db.screenshots.unsubscribe();
    });
  }

  public getScreenshot(tabId: number, timestamp: number): string {
    const image = this.db.screenshots.getImage(tabId, timestamp);
    if (image) return image.toString('base64');
  }

  public refreshMetadata(): ITimelineMetadata {
    // update if live
    if (this.liveSession) {
      this.commandTimeline = CommandTimeline.fromSession(this.liveSession, this.timelineRange);
    }
    this.lastMetadata = TimelineBuilder.createTimelineMetadata(this.commandTimeline, this.db);
    return this.lastMetadata;
  }

  private onHeroSessionResumed(): void {
    this.isPaused = false;
    if (!this.liveSession) return;

    for (const tab of this.liveSession.tabsById.values()) {
      this.recordTab(tab);
    }
  }

  private onHeroSessionWillClose(event: { waitForPromise?: Promise<any> }): void {
    if (!this.recordScreenUntilTime && !this.recordScreenUntilLoad) return;
    let loadPromise: Promise<any>;
    if (this.recordScreenUntilLoad && this.liveSession) {
      loadPromise = Promise.all(
        [...this.liveSession.tabsById.values()].map(x => {
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
      event.waitForPromise = Promise.race([
        // max wait time
        new Promise<void>(resolve => setTimeout(resolve, 60e3)),
        Promise.all([loadPromise, delayPromise]),
      ]).catch(() => null);
    }
  }

  private onHeroSessionPaused(): void {
    this.isPaused = true;
    if (!this.liveSession) return;
    this.stopRecording();
  }

  private stopRecording(): void {
    for (const tab of this.liveSession.tabsById.values()) {
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

    this.recordTab(tab);
  }

  private recordTab(tab: Tab): void {
    tab
      .recordScreen({
        includeWhiteScreens: true,
        includeDuplicates: true,
        jpegQuality: 1,
        format: 'jpeg',
      })
      .catch(console.error);
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
      [LoadStatus.AllContentLoaded, 'Load'],
    ];

    const urlChangeTimestamps: number[] = [];
    for (const nav of commandTimeline.loadedNavigations) {
      if (!mainFrameIds.has(nav.frameId)) continue;

      const urlOffset =
        urls.length === 0 ? 0 : commandTimeline.getTimelineOffsetForTimestamp(nav.initiatedTime);
      if (urlOffset === -1) continue;

      urls.push({
        tabId: nav.tabId,
        url: nav.finalUrl ?? nav.requestedUrl,
        offsetPercent: urlOffset,
        navigationId: nav.id,
        loadStatusOffsets: [],
      });
      const lastUrl = urls[urls.length - 1];

      for (const [loadStatus, name] of loadStatusLookups) {
        const timestamp = nav.statusChanges.get(loadStatus as LoadStatus);
        const offsetPercent = commandTimeline.getTimelineOffsetForTimestamp(timestamp);
        if (loadStatus === LoadStatus.HttpResponded) {
          urlChangeTimestamps.push(nav.initiatedTime);
        }
        if (offsetPercent !== -1) {
          lastUrl.loadStatusOffsets.push({
            timestamp,
            loadStatus: loadStatus as LoadStatus,
            status: name,
            offsetPercent,
          });
        }
      }
    }

    const screenshots: ITimelineMetadata['screenshots'] = [];
    for (const [tabId, times] of db.screenshots.getScreenshotTimesByTabId()) {
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
    let domChangeForUrl = 0;
    for (const [timestamp, domChanges] of db.domChanges.countByTimestamp) {
      // if we got back the response, reset our counter
      if (urlChangeTimestamps.length && timestamp > urlChangeTimestamps[0]) {
        urlChangeTimestamps.shift();
        domChangeForUrl = 0;
      }
      domChangeForUrl += domChanges;
      const offsetPercent = commandTimeline.getTimelineOffsetForTimestamp(timestamp);
      if (offsetPercent === -1) continue;
      paintEvents.push({
        domChanges: domChangeForUrl,
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
