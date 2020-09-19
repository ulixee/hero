import { NavigationReason } from '@secret-agent/core-interfaces/INavigation';

export interface IPuppetFrame {
  id: string;
  parentId?: string;
  name?: string;
  url: string;
  navigationReason?: string;
  disposition?: string;
  securityOrigin: string;
  waitForLoader(loaderId?: string): Promise<void>;
  evaluate<T>(expression: string, isolateFromWebPageEnvironment?: boolean): Promise<T>;
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
