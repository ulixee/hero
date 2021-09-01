export enum LoadStatus {
  NavigationRequested = 'NavigationRequested',
  HttpRequested = 'HttpRequested',
  HttpRedirected = 'HttpRedirected',
  HttpResponded = 'HttpResponded',

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
  DomContentLoaded: 4,
  PaintingStable: 5,
  AllContentLoaded: 6,
} as const;

export { LoadStatusPipeline };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LocationStatus = keyof typeof LocationStatus;
export type ILoadStatus = keyof typeof LoadStatus;
export type ILocationTrigger = keyof typeof LocationTrigger;
