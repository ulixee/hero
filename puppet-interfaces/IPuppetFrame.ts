import { NavigationReason } from '@secret-agent/core-interfaces/INavigation';

export interface IPuppetFrame {
  id: string;
  parentId?: string;
  name?: string;
  url: string;
  navigationReason?: string;
  disposition?: string;
  securityOrigin: string;
  waitForLoad(): Promise<void>;
  waitForLoader(loaderId?: string): Promise<Error | undefined>;
  evaluate<T>(expression: string, isolateFromWebPageEnvironment?: boolean): Promise<T>;
  evaluateOnIsolatedFrameElement<T>(expression: string): Promise<T>;
  toJSON(): object;
}

export interface ILifecycleEvents {
  DOMContentLoaded?: Date;
  load?: Date;
  init?: Date;
}

export interface IPuppetFrameEvents {
  'frame-created': { frame: IPuppetFrame };
  'frame-lifecycle': { frame: IPuppetFrame; name: string };
  'frame-navigated': { frame: IPuppetFrame; navigatedInDocument?: boolean };
  'frame-requested-navigation': { frame: IPuppetFrame; url: string; reason: NavigationReason };
}
