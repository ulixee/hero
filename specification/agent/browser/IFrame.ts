import type ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import { IJsPath } from '@ulixee/js-path';
import { IElementInteractVerification, IInteractionGroups } from '../interact/IInteractions';
import IDevtoolsSession from './IDevtoolsSession';
import { IFrameNavigations } from './IFrameNavigations';
import IJsPathFunctions from './IJsPathFunctions';
import INavigation from './INavigation';
import { IPage } from './IPage';
import IPoint from './IPoint';
import { ILoadStatus } from './Location';
import { NavigationReason } from './NavigationReason';

export interface IFrame extends ITypedEventEmitter<IFrameEvents> {
  frameId: number; // assigned id unique to the browser context

  id: string;
  childFrames: IFrame[];
  devtoolsSession: IDevtoolsSession;
  page?: IPage;
  parentId?: string;
  name?: string;
  url: string;
  activeLoader: INavigationLoader;
  navigationReason?: string;
  disposition?: string;
  securityOrigin: string;
  isDefaultUrl: boolean;
  isAttached: boolean;
  jsPath: IJsPathFunctions;

  navigations: IFrameNavigations;

  isOopif(): boolean;
  close(): void;
  interact(...interactionGroups: IInteractionGroups): Promise<void>;
  click(
    jsPathOrSelector: IJsPath | string,
    verification?: IElementInteractVerification,
  ): Promise<void>;
  waitForLifecycleEvent(
    event: keyof ILifecycleEvents,
    loaderId?: string,
    timeoutMs?: number,
  ): Promise<void>;

  waitForLoad(options?: { timeoutMs?: number; loadStatus?: ILoadStatus }): Promise<INavigation>;

  evaluate<T>(
    expression: string,
    options?: {
      isolateFromWebPageEnvironment?: boolean,
      shouldAwaitExpression?: boolean;
      retriesWaitingForLoad?: number;
      returnByValue?: boolean;
      includeCommandLineAPI?: boolean;
    },
  ): Promise<T>;

  resolveDevtoolsNodeId(
    devtoolsBackendNodeId: number,
    resolveInIsolatedContext?: boolean,
  ): Promise<string>;

  getFrameElementNodePointerId(): Promise<number>;
  getNodePointerId(devtoolsNodeId: string): Promise<number>;
  evaluateOnNode<T>(nodeId: string, expression: string): Promise<T>;

  waitForScrollStop(timeoutMs?: number): Promise<[scrollX: number, scrollY: number]>;

  getContainerOffset(): Promise<IPoint>;
  outerHTML(): Promise<string>;

  setFileInputFiles(nodePointerId: number, filePaths: string[]): Promise<void>;
  toJSON(): object;
}

export interface ILifecycleEvents {
  DOMContentLoaded?: number;
  load?: number;
  init?: number;
}

export interface INavigationLoader {
  id: string;
  isNavigationComplete: boolean;
  lifecycle: ILifecycleEvents;
  url: string;
}

export interface IFrameManagerEvents {
  'frame-created': { frame: IFrame; loaderId: string };
  'frame-navigated': { frame: IFrame; navigatedInDocument?: boolean; loaderId: string };
}

export interface IFrameEvents {
  'frame-lifecycle': {
    frame: IFrame;
    name: string;
    loader: INavigationLoader;
    timestamp: number;
  };
  'frame-navigated': { frame: IFrame; navigatedInDocument?: boolean; loaderId: string };
  'frame-requested-navigation': {
    frame: IFrame;
    url: string;
    reason: NavigationReason;
  };
  'frame-loader-created': {
    frame: IFrame;
    loaderId: string;
  };
}
