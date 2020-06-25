export enum LocationStatus {
  reload = 'reload',
  change = 'change',

  NavigationRequested = 'NavigationRequested',
  HttpRequested = 'HttpRequested',
  HttpRedirected = 'HttpRedirected',
  HttpResponded = 'HttpResponded',

  DomContentLoaded = 'DomContentLoaded',
  AllContentLoaded = 'AllContentLoaded',
}

export enum LocationTrigger {
  reload = 'reload',
  change = 'change',
}

export enum PipelineStatus {
  NavigationRequested = '0',
  HttpRequested = '1',
  HttpRedirected = '2',
  HttpResponded = '3',
  DomContentLoaded = '4',
  AllContentLoaded = '5',
}

export type ILocationStatus = keyof typeof LocationStatus;

export type ILocationTrigger = keyof typeof LocationTrigger;

export type IPipelineStatus = keyof typeof PipelineStatus;

export type IPipelineStep = 0 | 1 | 2 | 3 | 4 | 5;
