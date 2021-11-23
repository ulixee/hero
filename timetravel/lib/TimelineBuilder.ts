import CommandTimeline from '../lib/CommandTimeline';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import Session from '@ulixee/hero-core/lib/Session';

export default class TimelineBuilder {
  public commandTimeline: CommandTimeline;
  public lastMetadata: ITimelineMetadata;
  public readonly liveSession: Session;

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

  private readonly db: SessionDb;
  private _timelineRange: [startTime: number, endTime?: number];

  constructor(options: {
    db?: SessionDb;
    liveSession?: Session;
    timelineRange?: TimelineBuilder['_timelineRange'];
  }) {
    bindFunctions(this);
    this.liveSession = options.liveSession;
    this.db = options.db ?? options.liveSession?.db;
    this._timelineRange = options.timelineRange;
    this.commandTimeline = CommandTimeline.fromDb(this.db, this._timelineRange);
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

    const storageEvents: ITimelineMetadata['storageEvents'] = [];
    const changesByTabId: { [tabId: number]: number } = {};
    for (const { tabId, timestamp, count } of db.storageChanges.getChangesByTabIdAndTime()) {
      changesByTabId[tabId] ??= 0;
      changesByTabId[tabId] += count;
      const offsetPercent = commandTimeline.getTimelineOffsetForTimestamp(timestamp);
      if (offsetPercent === -1) continue;
      storageEvents.push({
        offsetPercent,
        tabId,
        count: changesByTabId[tabId],
      });
    }

    return {
      urls,
      screenshots,
      paintEvents,
      storageEvents,
    };
  }
}
