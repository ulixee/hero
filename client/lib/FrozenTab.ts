import * as Util from 'util';
import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Request from 'awaited-dom/impl/official-klasses/Request';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { IElementIsolate, INodeIsolate } from 'awaited-dom/base/interfaces/isolate';
import IScreenshotOptions from '@ulixee/hero-interfaces/IScreenshotOptions';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import CoreTab from './CoreTab';
import Hero from './Hero';
import FrozenFrameEnvironment from './FrozenFrameEnvironment';

const propertyKeys: (keyof FrozenTab)[] = [
  'tabId',
  'url',
  'document',
  'mainFrameEnvironment',
  'Request',
];

export default class FrozenTab {
  #hero: Hero;
  #coreTab: Promise<CoreTab>;
  #mainFrameEnvironment: FrozenFrameEnvironment;

  constructor(
    hero: Hero,
    tabAndJsPathsPromise: Promise<{ coreTab: CoreTab; prefetchedJsPaths: IJsPathResult[] }>,
  ) {
    this.#mainFrameEnvironment = new FrozenFrameEnvironment(
      hero,
      this,
      tabAndJsPathsPromise.then(x => x.coreTab).then(x => x.mainFrameEnvironment),
      tabAndJsPathsPromise.then(x => x.prefetchedJsPaths),
    );
    this.#hero = hero;
    this.#coreTab = tabAndJsPathsPromise.then(x => x.coreTab);
  }

  public get tabId(): Promise<number> {
    return this.#coreTab.then(x => x.tabId);
  }

  public get url(): Promise<string> {
    return this.mainFrameEnvironment.url;
  }

  public get mainFrameEnvironment(): FrozenFrameEnvironment {
    return this.#mainFrameEnvironment;
  }

  public get document(): SuperDocument {
    return this.mainFrameEnvironment.document;
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
    const coreTab = await this.#coreTab;
    return coreTab.takeScreenshot(options);
  }

  public close(): Promise<void> {
    return this.#coreTab.then(x => x.close());
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
