import * as Util from 'util';
import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Storage from 'awaited-dom/impl/official-klasses/Storage';
import Request from 'awaited-dom/impl/official-klasses/Request';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { IElementIsolate, INodeIsolate } from 'awaited-dom/base/interfaces/isolate';
import IScreenshotOptions from '@ulixee/hero-interfaces/IScreenshotOptions';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import CoreTab from './CoreTab';
import Resource, { createResource } from './Resource';
import CookieStorage from './CookieStorage';
import { Hero } from './Hero';
import FrozenFrameEnvironment from './FrozenFrameEnvironment';

const { getState, setState } = StateMachine<FrozenTab, IState>();

export interface IState {
  hero: Hero;
  coreTab: Promise<CoreTab>;
  mainFrameEnvironment: FrozenFrameEnvironment;
  frameEnvironments: FrozenFrameEnvironment[];
}

const propertyKeys: (keyof FrozenTab)[] = [
  'lastCommandId',
  'tabId',
  'url',
  'cookieStorage',
  'localStorage',
  'sessionStorage',
  'document',
  'mainFrameEnvironment',
  'Request',
];

export default class FrozenTab {
  constructor(
    hero: Hero,
    tabAndJsPathsPromise: Promise<{ coreTab: CoreTab; prefetchedJsPaths: IJsPathResult[] }>,
  ) {
    const mainFrameEnvironment = new FrozenFrameEnvironment(
      hero,
      this,
      tabAndJsPathsPromise.then(x => x.coreTab).then(x => x.mainFrameEnvironment),
      tabAndJsPathsPromise.then(x => x.prefetchedJsPaths),
    );
    setState(this, {
      hero,
      coreTab: tabAndJsPathsPromise.then(x => x.coreTab),
      mainFrameEnvironment,
      frameEnvironments: [mainFrameEnvironment],
    });
  }

  public get tabId(): Promise<number> {
    return getCoreTab(this).then(x => x.tabId);
  }

  public get lastCommandId(): Promise<number> {
    return getCoreTab(this).then(x => x.commandQueue.lastCommandId);
  }

  public get url(): Promise<string> {
    return this.mainFrameEnvironment.url;
  }

  public get mainFrameEnvironment(): FrozenFrameEnvironment {
    return getState(this).mainFrameEnvironment;
  }

  public get cookieStorage(): CookieStorage {
    return this.mainFrameEnvironment.cookieStorage;
  }

  public get document(): SuperDocument {
    return this.mainFrameEnvironment.document;
  }

  public get localStorage(): Storage {
    return this.mainFrameEnvironment.localStorage;
  }

  public get sessionStorage(): Storage {
    return this.mainFrameEnvironment.sessionStorage;
  }

  public get Request(): typeof Request {
    return this.mainFrameEnvironment.Request;
  }

  // METHODS

  public async fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return await this.mainFrameEnvironment.fetch(request, init);
  }

  public getComputedStyle(
    element: IElementIsolate,
    pseudoElement?: string,
  ): ReturnType<FrozenFrameEnvironment['getComputedStyle']> {
    return this.mainFrameEnvironment.getComputedStyle(element, pseudoElement);
  }

  public async goto(href: string, timeoutMs?: number): Promise<Resource> {
    const coreTab = await getCoreTab(this);
    const resource = await coreTab.goto(href, timeoutMs);
    return createResource(Promise.resolve(coreTab), resource);
  }

  public async goBack(timeoutMs?: number): Promise<string> {
    const coreTab = await getCoreTab(this);
    return coreTab.goBack(timeoutMs);
  }

  public async goForward(timeoutMs?: number): Promise<string> {
    const coreTab = await getCoreTab(this);
    return coreTab.goForward(timeoutMs);
  }

  public async reload(timeoutMs?: number): Promise<void> {
    const coreTab = await getCoreTab(this);
    return coreTab.reload(timeoutMs);
  }

  public async getJsValue<T>(path: string): Promise<T> {
    return await this.mainFrameEnvironment.getJsValue(path);
  }

  // @deprecated 2021-04-30: Replaced with getComputedVisibility
  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    return await this.getComputedVisibility(element as any).then(x => x.isVisible);
  }

  public async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    return await this.mainFrameEnvironment.getComputedVisibility(node);
  }

  public async takeScreenshot(options?: IScreenshotOptions): Promise<Buffer> {
    const coreTab = await getCoreTab(this);
    return coreTab.takeScreenshot(options);
  }

  public close(): Promise<void> {
    return getCoreTab(this).then(x => x.close());
  }

  public toJSON(): any {
    // return empty so we can avoid infinite "stringifying" in jest
    return {
      type: this.constructor.name,
    };
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }
}

export function getCoreTab(tab: FrozenTab): Promise<CoreTab> {
  return getState(tab).coreTab;
}
