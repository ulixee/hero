import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement, ISuperNode, ISuperNodeList } from 'awaited-dom/base/interfaces/super';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import XPathResult from 'awaited-dom/impl/official-klasses/XPathResult';
import Storage from 'awaited-dom/impl/official-klasses/Storage';
import CSSStyleDeclaration from 'awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import {
  createCSSStyleDeclaration,
  createResponse,
  createStorage,
  createSuperDocument,
  createSuperNode,
  createSuperNodeList,
} from 'awaited-dom/impl/create';
import Request from 'awaited-dom/impl/official-klasses/Request';
import {
  ILoadStatus,
  ILocationTrigger,
  LocationStatus,
} from '@ulixee/unblocked-specification/agent/browser/Location';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import Response from 'awaited-dom/impl/official-klasses/Response';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import {
  IElementIsolate,
  IHTMLFrameElementIsolate,
  IHTMLIFrameElementIsolate,
  IHTMLObjectElementIsolate,
  INodeIsolate,
} from 'awaited-dom/base/interfaces/isolate';
import { INodeVisibility } from '@ulixee/js-path';
import { INodePointer } from '@ulixee/hero-interfaces/AwaitedDom';
import { IMousePositionXY } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Hero from './Hero';
import { getAwaitedPathAsMethodArg } from './SetupAwaitedHandler';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import Tab, { getCoreTab } from './Tab';
import Resource, { createResource } from './Resource';
import { InternalPropertiesSymbol } from './internal';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

interface ISharedInternalProperties {
  coreFramePromise: Promise<CoreFrameEnvironment>;
}

export default class FrameEnvironment {
  #hero: Hero;
  #tab: Tab;
  #coreFramePromise: Promise<CoreFrameEnvironment>;

  get [InternalPropertiesSymbol](): ISharedInternalProperties {
    return {
      coreFramePromise: this.#coreFramePromise,
    };
  }

  constructor(hero: Hero, tab: Tab, coreFramePromise: Promise<CoreFrameEnvironment>) {
    this.#hero = hero;
    this.#tab = tab;
    this.#coreFramePromise = coreFramePromise;

    async function sendToFrameEnvironment(pluginId: string, ...args: any[]): Promise<any> {
      return (await coreFramePromise).commandQueue.run(
        'FrameEnvironment.runPluginCommand',
        pluginId,
        args,
      );
    }

    for (const clientPlugin of hero[InternalPropertiesSymbol].clientPlugins) {
      if (clientPlugin.onFrameEnvironment)
        clientPlugin.onFrameEnvironment(hero, this, sendToFrameEnvironment);
    }
  }

  public get isMainFrame(): Promise<boolean> {
    return this.parentFrameId.then(x => !x);
  }

  public get frameId(): Promise<number> {
    return this.#coreFramePromise.then(x => x.frameId);
  }

  public get children(): Promise<FrameEnvironment[]> {
    return this.#tab.frameEnvironments.then(async frames => {
      const frameId = await this.frameId;

      const childFrames: FrameEnvironment[] = [];
      for (const frame of frames) {
        const parentFrameId = await frame.parentFrameId;
        if (parentFrameId === frameId) {
          childFrames.push(frame);
        }
      }
      return childFrames;
    });
  }

  public get url(): Promise<string> {
    return this.#coreFramePromise.then(x => x.getUrl());
  }

  public get isPaintingStable(): Promise<boolean> {
    return this.#coreFramePromise.then(x => x.isPaintingStable());
  }

  public get isDomContentLoaded(): Promise<boolean> {
    return this.#coreFramePromise.then(x => x.isDomContentLoaded());
  }

  public get isAllContentLoaded(): Promise<boolean> {
    return this.#coreFramePromise.then(x => x.isAllContentLoaded());
  }

  public get name(): Promise<string> {
    return this.#coreFramePromise.then(x => x.getFrameMeta()).then(x => x.name);
  }

  public get parentFrameId(): Promise<number | null> {
    return this.#coreFramePromise.then(x => x.parentFrameId);
  }

  public get cookieStorage(): CookieStorage {
    return createCookieStorage(this.#coreFramePromise);
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath(null, 'document');
    const awaitedOptions = { coreFrame: this.#coreFramePromise };
    return createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions) as SuperDocument;
  }

  public get localStorage(): Storage {
    const awaitedPath = new AwaitedPath(null, 'localStorage');
    const awaitedOptions = { coreFrame: this.#coreFramePromise };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get sessionStorage(): Storage {
    const awaitedPath = new AwaitedPath(null, 'sessionStorage');
    const awaitedOptions = { coreFrame: this.#coreFramePromise };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get Request(): typeof Request {
    return RequestGenerator(this.#coreFramePromise);
  }

  // METHODS

  public async fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    const requestInput = await getRequestIdOrUrl(request);
    const coreFrame = await this.#coreFramePromise;
    const nodePointer = await coreFrame.fetch(requestInput, init);

    const awaitedPath = new AwaitedPath(null).withNodeId(null, nodePointer.id);
    return createResponse(awaitedPath, { coreFrame: this.#coreFramePromise });
  }

  public async getFrameEnvironment(
    element: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate,
  ): Promise<FrameEnvironment | null> {
    return await this.#tab.getFrameEnvironment(element);
  }

  public getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration {
    const { awaitedPath: elementAwaitedPath, awaitedOptions } = awaitedPathState.getState(element);
    const awaitedPath = new AwaitedPath(null, 'window', [
      'getComputedStyle',
      getAwaitedPathAsMethodArg(elementAwaitedPath),
      pseudoElement,
    ]);
    return createCSSStyleDeclaration<IAwaitedOptions>(
      awaitedPath,
      awaitedOptions,
    ) as CSSStyleDeclaration;
  }

  public async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    if (!node) return { isVisible: false, nodeExists: false, isClickable: false };
    const coreFrame = await this.#coreFramePromise;
    return await coreFrame.getComputedVisibility(node);
  }

  // @deprecated 2021-04-30: Replaced with getComputedVisibility
  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    return await this.getComputedVisibility(element as any).then(x => x.isVisible);
  }

  public async getJsValue<T>(path: string): Promise<T> {
    const coreFrame = await this.#coreFramePromise;
    return coreFrame.getJsValue<T>(path);
  }

  public querySelector(selector: string): ISuperNode {
    const awaitedPath = new AwaitedPath(null, 'document', ['querySelector', selector]);
    const awaitedOptions: IAwaitedOptions = { coreFrame: this.#coreFramePromise };
    return createSuperNode(awaitedPath, awaitedOptions);
  }

  public querySelectorAll(selector: string): ISuperNodeList {
    const awaitedPath = new AwaitedPath(null, 'document', ['querySelectorAll', selector]);
    const awaitedOptions: IAwaitedOptions = { coreFrame: this.#coreFramePromise };
    return createSuperNodeList(awaitedPath, awaitedOptions);
  }

  public xpathSelector(xpath: string, orderedNodeResults = false): ISuperNode {
    return this.document.evaluate(
      xpath,
      this.document,
      null,
      orderedNodeResults
        ? XPathResult.FIRST_ORDERED_NODE_TYPE
        : XPathResult.ANY_UNORDERED_NODE_TYPE,
    ).singleNodeValue;
  }

  public async xpathSelectorAll(xpath: string, orderedNodeResults = false): Promise<ISuperNode[]> {
    const results = await this.document.evaluate(
      xpath,
      this.document,
      null,
      orderedNodeResults
        ? XPathResult.ORDERED_NODE_ITERATOR_TYPE
        : XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
    );
    const nodes: ISuperNode[] = [];
    let node: ISuperNode;
    // eslint-disable-next-line no-cond-assign
    while ((node = await results.iterateNext())) {
      nodes.push(node);
    }
    return nodes;
  }

  public async waitForPaintingStable(options?: IWaitForOptions): Promise<void> {
    const coreFrame = await this.#coreFramePromise;
    await coreFrame.waitForLoad(LocationStatus.PaintingStable, options);
  }

  public async waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void> {
    const coreFrame = await this.#coreFramePromise;
    await coreFrame.waitForLoad(status, options);
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<ISuperElement | null> {
    const coreFrame = await this.#coreFramePromise;
    return await coreFrame.waitForElement(element, options);
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<Resource> {
    const coreFrame = await this.#coreFramePromise;
    const resourceMeta = await coreFrame.waitForLocation(trigger, options);
    const coreTab = getCoreTab(this.#tab);
    return createResource(coreTab, resourceMeta);
  }

  public toJSON(): any {
    // return empty so we can avoid infinite "stringifying" in jest
    return {
      type: this.constructor.name,
    };
  }
}

export function getCoreFrameEnvironmentForPosition(
  mousePosition: IMousePositionXY | ISuperElement,
): Promise<CoreFrameEnvironment> {
  const state = awaitedPathState.getState(mousePosition);
  if (!state) return;
  return state?.awaitedOptions?.coreFrame;
}

// CREATE

export function createFrame(
  hero: Hero,
  tab: Tab,
  coreFrame: Promise<CoreFrameEnvironment>,
): FrameEnvironment {
  return new FrameEnvironment(hero, tab, coreFrame);
}
