import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import * as Util from 'util';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement, ISuperNode, ISuperNodeList } from 'awaited-dom/base/interfaces/super';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
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
import { ILoadStatus, ILocationTrigger, LocationStatus } from '@ulixee/hero-interfaces/Location';
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
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import { INodePointer } from '@ulixee/hero-interfaces/AwaitedDom';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Hero, { IState as IHeroState } from './Hero';
import {
  createHeroCommandAwaitedPath,
  createInstanceWithNodePointer,
  getAwaitedPathAsMethodArg,
} from './SetupAwaitedHandler';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import Tab, { IState as ITabState } from './Tab';
import { IMousePosition } from '../interfaces/IInteractions';
import Resource, { createResource } from './Resource';
import IMagicSelectorOptions from '@ulixee/hero-interfaces/IMagicSelectorOptions';

const { getState, setState } = StateMachine<FrameEnvironment, IState>();
const { getState: getTabState } = StateMachine<Tab, ITabState>();
const heroState = StateMachine<Hero, IHeroState>();
const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

export interface IState {
  hero: Hero;
  tab: Tab;
  coreFrame: Promise<CoreFrameEnvironment>;
}

const propertyKeys: (keyof FrameEnvironment)[] = [
  'frameId',
  'url',
  'isPaintingStable',
  'isAllContentLoaded',
  'isDomContentLoaded',
  'name',
  'parentFrameId',
  'cookieStorage',
  'localStorage',
  'sessionStorage',
  'document',
  'Request',
];

export default class FrameEnvironment {
  constructor(hero: Hero, tab: Tab, coreFrame: Promise<CoreFrameEnvironment>) {
    setState(this, {
      hero,
      tab,
      coreFrame,
    });

    async function sendToFrameEnvironment(pluginId: string, ...args: any[]): Promise<any> {
      return (await coreFrame).commandQueue.run(
        'FrameEnvironment.runPluginCommand',
        pluginId,
        args,
      );
    }

    for (const clientPlugin of heroState.getState(hero).clientPlugins) {
      if (clientPlugin.onFrameEnvironment)
        clientPlugin.onFrameEnvironment(hero, this, sendToFrameEnvironment);
    }
  }

  public get isMainFrame(): Promise<boolean> {
    return this.parentFrameId.then(x => !x);
  }

  public get frameId(): Promise<number> {
    return getCoreFrameEnvironment(this).then(x => x.frameId);
  }

  public get children(): Promise<FrameEnvironment[]> {
    return getState(this).tab.frameEnvironments.then(async frames => {
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
    return getCoreFrameEnvironment(this).then(x => x.getUrl());
  }

  public get isPaintingStable(): Promise<boolean> {
    return getCoreFrameEnvironment(this).then(x => x.isPaintingStable());
  }

  public get isDomContentLoaded(): Promise<boolean> {
    return getCoreFrameEnvironment(this).then(x => x.isDomContentLoaded());
  }

  public get isAllContentLoaded(): Promise<boolean> {
    return getCoreFrameEnvironment(this).then(x => x.isAllContentLoaded());
  }

  public get name(): Promise<string> {
    return getCoreFrameEnvironment(this)
      .then(x => x.getFrameMeta())
      .then(x => x.name);
  }

  public get parentFrameId(): Promise<number | null> {
    return getCoreFrameEnvironment(this).then(x => x.parentFrameId);
  }

  public get cookieStorage(): CookieStorage {
    return createCookieStorage(getCoreFrameEnvironment(this));
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath(null, 'document');
    const awaitedOptions = { ...getState(this) };
    return createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions) as SuperDocument;
  }

  public get localStorage(): Storage {
    const awaitedPath = new AwaitedPath(null, 'localStorage');
    const awaitedOptions = { ...getState(this) };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get sessionStorage(): Storage {
    const awaitedPath = new AwaitedPath(null, 'sessionStorage');
    const awaitedOptions = { ...getState(this) };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get Request(): typeof Request {
    return RequestGenerator(getCoreFrameEnvironment(this));
  }

  // METHODS

  public async fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    const requestInput = await getRequestIdOrUrl(request);
    const coreFrame = await getCoreFrameEnvironment(this);
    const nodePointer = await coreFrame.fetch(requestInput, init);

    const awaitedPath = new AwaitedPath(null).withNodeId(null, nodePointer.id);
    return createResponse(awaitedPath, { ...getState(this) });
  }

  public async getFrameEnvironment(
    element: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate,
  ): Promise<FrameEnvironment | null> {
    const { tab } = getState(this);
    return await tab.getFrameEnvironment(element);
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
    if (!node) return { isVisible: false, nodeExists: false };
    const coreFrame = await getCoreFrameEnvironment(this);
    return await coreFrame.getComputedVisibility(node);
  }

  // @deprecated 2021-04-30: Replaced with getComputedVisibility
  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    return await this.getComputedVisibility(element as any).then(x => x.isVisible);
  }

  public async getJsValue<T>(path: string): Promise<T> {
    const coreFrame = await getCoreFrameEnvironment(this);
    return coreFrame.getJsValue<T>(path);
  }

  public magicSelector(selectorOrOptions?: string | IMagicSelectorOptions): ISuperNode {
    const awaitedPath = createHeroCommandAwaitedPath('FrameEnvironment.magicSelector', [
      selectorOrOptions,
    ]);
    const awaitedOptions: IAwaitedOptions = { coreFrame: getState(this).coreFrame };
    return createSuperNode(awaitedPath, awaitedOptions);
  }

  public magicSelectorAll(selectorOrOptions?: string | IMagicSelectorOptions): ISuperNodeList {
    const awaitedPath = createHeroCommandAwaitedPath('FrameEnvironment.magicSelectorAll', [
      selectorOrOptions,
    ]);
    const awaitedOptions: IAwaitedOptions = { coreFrame: getState(this).coreFrame };
    return createSuperNodeList(awaitedPath, awaitedOptions);
  }

  public async waitForPaintingStable(options?: IWaitForOptions): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this);
    await coreFrame.waitForLoad(LocationStatus.PaintingStable, options);
  }

  public async waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this);
    await coreFrame.waitForLoad(status, options);
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<ISuperElement | null> {
    if (!element) throw new Error('Element being waited for is null');
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(element);
    const coreFrame = await getCoreFrameEnvironment(this);
    const nodePointer = await coreFrame.waitForElement(awaitedPath.toJSON(), options);
    if (!nodePointer) return null;
    return createInstanceWithNodePointer(
      awaitedPathState,
      awaitedPath,
      awaitedOptions,
      nodePointer,
    );
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<Resource> {
    const coreFrame = await getCoreFrameEnvironment(this);
    const resourceMeta = await coreFrame.waitForLocation(trigger, options);
    const { tab } = getState(this);
    const { coreTab } = getTabState(tab);
    return createResource(coreTab, resourceMeta);
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

export function getFrameState(object: any): IState {
  return getState(object);
}

export function getCoreFrameEnvironment(
  frameEnvironment: FrameEnvironment,
): Promise<CoreFrameEnvironment> {
  return getState(frameEnvironment).coreFrame;
}

export function getCoreFrameEnvironmentForPosition(
  mousePosition: IMousePosition,
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
