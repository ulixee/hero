import { NavigationReason } from '@secret-agent/core-interfaces/IPage';

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
  frameCreated: { frame: IPuppetFrame };
  frameLifecycle: { frame: IPuppetFrame; name: string };
  frameNavigated: { frame: IPuppetFrame; navigatedInDocument?: boolean };
  frameRequestedNavigation: { frame: IPuppetFrame; url: string; reason: NavigationReason };
}
