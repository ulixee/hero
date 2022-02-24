export enum LoadStatus {
  NavigationRequested = 'NavigationRequested',
  HttpRequested = 'HttpRequested',
  HttpRedirected = 'HttpRedirected',
  HttpResponded = 'HttpResponded',

  JavascriptReady = 'JavascriptReady',
  DomContentLoaded = 'DomContentLoaded',
  PaintingStable = 'PaintingStable',
  AllContentLoaded = 'AllContentLoaded',
}

export enum LocationTrigger {
  reload = 'reload',
  change = 'change',
}

export const LocationStatus = { ...LocationTrigger, ...LoadStatus } as const;

const LoadStatusPipeline = {
  NavigationRequested: 0,
  HttpRequested: 1,
  HttpRedirected: 2,
  HttpResponded: 3,
  JavascriptReady: 4,
  DomContentLoaded: 5,
  PaintingStable: 6,
  AllContentLoaded: 7,
} as const;

export { LoadStatusPipeline };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LocationStatus = keyof typeof LocationStatus;
export type ILoadStatus = keyof typeof LoadStatus;
export type ILocationTrigger = keyof typeof LocationTrigger;
