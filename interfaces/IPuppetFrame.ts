import { NavigationReason } from './INavigation';
import ITypedEventEmitter from './ITypedEventEmitter';

export interface IPuppetFrame extends ITypedEventEmitter<IPuppetFrameEvents> {
  id: string;
  parentId?: string;
  name?: string;
  url: string;
  activeLoaderId: string;
  navigationReason?: string;
  disposition?: string;
  securityOrigin: string;
  isLoaded: boolean;
  isDefaultUrl: boolean;
  isAttached(): boolean;
  waitForLoad(): Promise<void>;
  waitForLoader(loaderId?: string): Promise<Error | undefined>;
  canEvaluate(isolatedFromWebPageEnvironment: boolean): boolean;
  evaluate<T>(
    expression: string,
    isolateFromWebPageEnvironment?: boolean,
    options?: { shouldAwaitExpression?: boolean; retriesWaitingForLoad?: number },
  ): Promise<T>;
  evaluateOnIsolatedFrameElement<T>(expression: string): Promise<T>;
  toJSON(): object;
}

export interface ILifecycleEvents {
  DOMContentLoaded?: Date;
  load?: Date;
  init?: Date;
}

export interface IPuppetFrameManagerEvents {
  'frame-created': { frame: IPuppetFrame; loaderId: string };
}
export interface IPuppetFrameEvents {
  'frame-lifecycle': { frame: IPuppetFrame; name: string; loaderId: string };
  'frame-navigated': { frame: IPuppetFrame; navigatedInDocument?: boolean; loaderId?: string };
  'frame-requested-navigation': {
    frame: IPuppetFrame;
    url: string;
    reason: NavigationReason;
  };
  'frame-loader-created': {
    frame: IPuppetFrame;
    loaderId: string;
  };
}
