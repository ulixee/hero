import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement, ISuperNode, ISuperNodeList } from 'awaited-dom/base/interfaces/super';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Storage from 'awaited-dom/impl/official-klasses/Storage';
import CSSStyleDeclaration from 'awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { ILoadStatus, ILocationTrigger } from '@ulixee/hero-interfaces/Location';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
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
import IScreenshotOptions from '@ulixee/hero-interfaces/IScreenshotOptions';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import * as Util from 'util';
import CoreTab from './CoreTab';
import Resource, { createResource } from './Resource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import WebsocketResource from './WebsocketResource';
import AwaitedEventTarget from './AwaitedEventTarget';
import CookieStorage from './CookieStorage';
import Hero from './Hero';
import FrameEnvironment from './FrameEnvironment';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import Dialog from './Dialog';
import FileChooser from './FileChooser';
import DomState from './DomState';
import IDomState, { IDomStateAllFn } from '@ulixee/hero-interfaces/IDomState';
import { InternalPropertiesSymbol, scriptInstance } from './internal';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions }
>();

interface ISharedInternalProperties {
  coreTabPromise: Promise<CoreTab>;
}

interface IEventType {
  resource: (resource: Resource | WebsocketResource) => void;
  dialog: (dialog: Dialog) => void;
}

const propertyKeys: (keyof Tab)[] = [
  'lastCommandId',
  'tabId',
  'url',
  'isPaintingStable',
  'isAllContentLoaded',
  'isDomContentLoaded',
  'cookieStorage',
  'localStorage',
  'sessionStorage',
  'document',
  'frameEnvironments',
  'mainFrameEnvironment',
  'Request',
];

export default class Tab extends AwaitedEventTarget<IEventType> {
  #hero: Hero;
  #mainFrameEnvironment: FrameEnvironment;
  #frameEnvironments: FrameEnvironment[];
  #coreTabPromise: Promise<CoreTab>;

  get [InternalPropertiesSymbol](): ISharedInternalProperties {
    return {
      coreTabPromise: this.#coreTabPromise,
    };
  }

  constructor(hero: Hero, coreTabPromise: Promise<CoreTab>) {
    super(() => {
      return { target: coreTabPromise };
    });
    this.#hero = hero;
    this.#mainFrameEnvironment = new FrameEnvironment(
      hero,
      this,
      coreTabPromise.then(x => x.mainFrameEnvironment),
    );
    this.#frameEnvironments = [this.#mainFrameEnvironment];
    this.#coreTabPromise = coreTabPromise;

    async function sendToTab(pluginId: string, ...args: any[]): Promise<any> {
      return (await coreTabPromise).commandQueue.run('Tab.runPluginCommand', pluginId, args);
    }

    for (const clientPlugin of hero[InternalPropertiesSymbol].clientPlugins) {
      if (clientPlugin.onTab) clientPlugin.onTab(hero, this, sendToTab);
    }
  }

  public get tabId(): Promise<number> {
    return this.#coreTabPromise.then(x => x.tabId);
  }

  public get lastCommandId(): Promise<number> {
    return this.#coreTabPromise.then(x => x.commandQueue.lastCommandId);
  }

  public get url(): Promise<string> {
    return this.mainFrameEnvironment.url;
  }

  public get isPaintingStable(): Promise<boolean> {
    return this.mainFrameEnvironment.isPaintingStable;
  }

  public get isDomContentLoaded(): Promise<boolean> {
    return this.mainFrameEnvironment.isDomContentLoaded;
  }

  public get isAllContentLoaded(): Promise<boolean> {
    return this.mainFrameEnvironment.isAllContentLoaded;
  }

  public get mainFrameEnvironment(): FrameEnvironment {
    return this.#mainFrameEnvironment;
  }

  public get cookieStorage(): CookieStorage {
    return this.mainFrameEnvironment.cookieStorage;
  }

  public get frameEnvironments(): Promise<FrameEnvironment[]> {
    return this.#getRefreshedFrameEnvironments();
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

  public findResource(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId: number },
  ): Promise<Resource> {
    return Resource.findLatest(this, filter, options);
  }

  public async fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return await this.mainFrameEnvironment.fetch(request, init);
  }

  public async getFrameEnvironment(
    element: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate,
  ): Promise<FrameEnvironment | null> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(element);
    const elementCoreFrame = await awaitedOptions.coreFrame;
    const frameMeta = await elementCoreFrame.getChildFrameEnvironment(awaitedPath.toJSON());
    if (!frameMeta) return null;

    const coreTab = await this.#coreTabPromise;
    return await this.#getOrCreateFrameEnvironment(coreTab.getCoreFrameForMeta(frameMeta));
  }

  public getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration {
    return this.mainFrameEnvironment.getComputedStyle(element, pseudoElement);
  }

  public async goto(href: string, options?: { timeoutMs?: number }): Promise<Resource> {
    const coreTab = await this.#coreTabPromise;
    const resource = await coreTab.goto(href, options);
    return createResource(Promise.resolve(coreTab), resource);
  }

  public async goBack(options?: { timeoutMs?: number }): Promise<string> {
    const coreTab = await this.#coreTabPromise;
    return coreTab.goBack(options);
  }

  public async goForward(options?: { timeoutMs?: number }): Promise<string> {
    const coreTab = await this.#coreTabPromise;
    return coreTab.goForward(options);
  }

  public async reload(options?: { timeoutMs?: number }): Promise<Resource> {
    const coreTab = await this.#coreTabPromise;
    const resource = await coreTab.reload(options);
    return createResource(Promise.resolve(coreTab), resource);
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

  public querySelector(selector: string): ISuperNode {
    return this.mainFrameEnvironment.querySelector(selector);
  }

  public querySelectorAll(selector: string): ISuperNodeList {
    return this.mainFrameEnvironment.querySelectorAll(selector);
  }

  public xpathSelector(xpath: string, orderedNodeResults = false): ISuperNode {
    return this.mainFrameEnvironment.xpathSelector(xpath, orderedNodeResults);
  }

  public xpathSelectorAll(xpath: string, orderedNodeResults = false): Promise<ISuperNode[]> {
    return this.mainFrameEnvironment.xpathSelectorAll(xpath, orderedNodeResults);
  }

  public async takeScreenshot(options?: IScreenshotOptions): Promise<Buffer> {
    const coreTab = await this.#coreTabPromise;
    return coreTab.takeScreenshot(options);
  }

  public async waitForFileChooser(options?: IWaitForOptions): Promise<FileChooser> {
    const coreTab = await this.#coreTabPromise;
    const prompt = await coreTab.waitForFileChooser(options);
    const coreFrame = coreTab.frameEnvironmentsById.get(prompt.frameId);
    return new FileChooser(Promise.resolve(coreFrame), prompt);
  }

  public async waitForPaintingStable(options?: IWaitForOptions): Promise<void> {
    return await this.mainFrameEnvironment.waitForPaintingStable(options);
  }

  public async waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void> {
    return await this.mainFrameEnvironment.waitForLoad(status, options);
  }

  public async waitForState(
    state: IDomState | DomState | IDomStateAllFn,
    options: Pick<IWaitForOptions, 'timeoutMs'> = { timeoutMs: 30e3 },
  ): Promise<void> {
    const coreTab = await this.#coreTabPromise;
    return coreTab.waitForState(state, options);
  }

  public async validateState(state: IDomState | DomState | IDomStateAllFn): Promise<boolean> {
    const callsitePath = scriptInstance.getScriptCallsite();
    const coreTab = await this.#coreTabPromise;
    return coreTab.validateState(state, callsitePath);
  }

  public async registerFlowHandler(
    name: string,
    state: IDomState | DomState | IDomStateAllFn,
    handlerFn: (error?: Error) => Promise<any>,
  ): Promise<void> {
    const callsitePath = scriptInstance.getScriptCallsite();

    const coreTab = await this.#coreTabPromise;
    await coreTab.registerFlowHandler(name, state, handlerFn, callsitePath);
  }

  public async triggerFlowHandlers(): Promise<void> {
    const coreTab = await this.#coreTabPromise;
    await coreTab.triggerFlowHandlers();
  }

  public async flowCommand<T = void>(
    commandFn: () => Promise<T>,
    exitState?: IDomState | DomState | IDomStateAllFn,
    options?: IFlowCommandOptions
  ): Promise<T> {
    const callsitePath = scriptInstance.getScriptCallsite();

    const coreTab = await this.#coreTabPromise;
    return await coreTab.runFlowCommand(commandFn, exitState, callsitePath, options);
  }

  public waitForResource(
    filter: IWaitForResourceFilter,
    options?: IWaitForResourceOptions,
  ): Promise<(Resource | WebsocketResource)[]> {
    return Resource.waitFor(this, filter, options);
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<ISuperElement> {
    return await this.mainFrameEnvironment.waitForElement(element, options);
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<Resource> {
    return await this.mainFrameEnvironment.waitForLocation(trigger, options);
  }

  public async waitForMillis(millis: number): Promise<void> {
    const coreTab = await this.#coreTabPromise;
    await coreTab.waitForMillis(millis);
  }

  public focus(): Promise<void> {
    return this.#hero.focusTab(this);
  }

  public async close(): Promise<void> {
    await this.#hero.closeTab(this);
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

  async #getOrCreateFrameEnvironment(coreFrame: CoreFrameEnvironment): Promise<FrameEnvironment> {
    const frameEnvironments = this.#frameEnvironments;

    for (const frameEnvironment of frameEnvironments) {
      const frameId = await frameEnvironment.frameId;
      if (frameId === coreFrame.frameId) return frameEnvironment;
    }
    const frameEnvironment = new FrameEnvironment(this.#hero, this, Promise.resolve(coreFrame));
    frameEnvironments.push(frameEnvironment);
    return frameEnvironment;
  }

  async #getRefreshedFrameEnvironments(): Promise<FrameEnvironment[]> {
    const coreTab = await this.#coreTabPromise;
    const coreFrames = await coreTab.getCoreFrameEnvironments();

    const newFrameIds = coreFrames.map(x => x.frameId);

    for (const frameEnvironment of this.#frameEnvironments) {
      const id = await frameEnvironment.frameId;
      // remove frames that are gone
      if (!newFrameIds.includes(id)) {
        const idx = this.#frameEnvironments.indexOf(frameEnvironment);
        this.#frameEnvironments.splice(idx, 1);
      }
    }

    await Promise.all(coreFrames.map(x => this.#getOrCreateFrameEnvironment(x)));

    return this.#frameEnvironments;
  }
}

export function getCoreTab(tab: Tab): Promise<CoreTab> {
  return tab[InternalPropertiesSymbol].coreTabPromise.then(x => {
    if (x instanceof Error) throw x;
    return x;
  });
}

// CREATE

export function createTab(hero: Hero, coreTab: Promise<CoreTab>): Tab {
  return new Tab(hero, coreTab);
}
