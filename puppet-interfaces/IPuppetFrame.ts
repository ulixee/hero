import { NavigationReason } from '@secret-agent/core-interfaces/INavigation';
import ITypedEventEmitter from '@secret-agent/core-interfaces/ITypedEventEmitter';

export interface IPuppetFrame extends ITypedEventEmitter<IPuppetFrameEvents> {
  id: string;
  parentId?: string;
  name?: string;
  url: string;
  navigationReason?: string;
  disposition?: string;
  securityOrigin: string;
  isLoaded: boolean;
  isAttached(): boolean;
  waitForLoad(): Promise<void>;
  waitForLoader(loaderId?: string): Promise<Error | undefined>;
  canEvaluate(isolatedFromWebPageEnvironment: boolean): boolean;
  evaluate<T>(
    expression: string,
    isolateFromWebPageEnvironment?: boolean,
    shouldAwaitExpression?: boolean,
  ): Promise<T>;
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

export interface IPuppetFrameInternalEvents {
  'default-context-created': { executionContextId: number };
  'isolated-context-created': { executionContextId: number };
}
