import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { NavigationReason } from './INavigation';

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
  resolveNodeId(backendNodeId: number): Promise<string>;
  waitForLoad(eventName?: keyof ILifecycleEvents): Promise<void>;
  waitForLoader(loaderId?: string): Promise<Error | undefined>;
  canEvaluate(isolatedFromWebPageEnvironment: boolean): boolean;
  getFrameElementNodeId(): Promise<string>;
  evaluate<T>(
    expression: string,
    isolateFromWebPageEnvironment?: boolean,
    options?: { shouldAwaitExpression?: boolean; retriesWaitingForLoad?: number },
  ): Promise<T>;
  evaluateOnNode<T>(nodeId: string, expression: string): Promise<T>;
  setFileInputFiles(nodeId: string, filePaths: string[]): Promise<void>;
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
