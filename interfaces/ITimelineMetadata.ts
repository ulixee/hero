import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';

export default interface ITimelineMetadata {
  // don't group by tabid/frameid for now
  paintEvents: {
    offsetPercent: number;
    domChanges: number;
  }[];
  urls: {
    tabId: number;
    navigationId: number;
    url: string;
    offsetPercent: number;
    loadStatusOffsets: {
      timestamp: number;
      loadStatus: LoadStatus;
      status: string;
      offsetPercent: number;
    }[];
  }[];
  screenshots: {
    timestamp: number;
    offsetPercent: number;
    tabId: number;
  }[];
  storageEvents: {
    offsetPercent: number;
    tabId: number;
    count: number;
  }[];
}
