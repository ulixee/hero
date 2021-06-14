import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import * as Util from 'util';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
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
} from 'awaited-dom/impl/create';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { ILocationTrigger, LocationStatus } from '@secret-agent/interfaces/Location';
import IWaitForElementOptions from '@secret-agent/interfaces/IWaitForElementOptions';
import Response from 'awaited-dom/impl/official-klasses/Response';
import IWaitForOptions from '@secret-agent/interfaces/IWaitForOptions';
import {
  IElementIsolate,
  IHTMLFrameElementIsolate,
  IHTMLIFrameElementIsolate,
  IHTMLObjectElementIsolate,
  INodeIsolate,
} from 'awaited-dom/base/interfaces/isolate';
import { INodeVisibility } from '@secret-agent/interfaces/INodeVisibility';
import { getComputedVisibilityFnName } from '@secret-agent/interfaces/jsPathFnNames';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Agent from './Agent';
import { delegate as AwaitedHandler, getAwaitedPathAsMethodArg } from './SetupAwaitedHandler';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import Tab from './Tab';

const { getState, setState } = StateMachine<FrameEnvironment, IState>();
const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions }
>();

export interface IState {
  secretAgent: Agent;
  tab: Tab;
  coreFrame: Promise<CoreFrameEnvironment>;
}

const propertyKeys: (keyof FrameEnvironment)[] = [
  'frameId',
  'url',
  'name',
  'parentFrameId',
  'cookieStorage',
  'localStorage',
  'sessionStorage',
  'document',
  'Request',
];

export default class FrameEnvironment {
  constructor(secretAgent: Agent, tab: Tab, coreFrame: Promise<CoreFrameEnvironment>) {
    setState(this, {
      secretAgent,
      tab,
      coreFrame,
    });
  }

  public get isMainFrame(): Promise<boolean> {
    return this.parentFrameId.then(x => !x);
  }

  public get frameId(): Promise<number> {
    return getCoreFrameEnvironment(this).then(x => x.frameId);
  }

  public get url(): Promise<string> {
    return getCoreFrameEnvironment(this).then(x => x.getUrl());
  }

  public get name(): Promise<string> {
    return getCoreFrameEnvironment(this)
      .then(x => x.getFrameMeta())
      .then(x => x.name);
  }

  public get parentFrameId(): Promise<number | null> {
    return getCoreFrameEnvironment(this)
      .then(x => x.getFrameMeta())
      .then(x => x.parentFrameId);
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
    return FrameEnvironment.getComputedStyle(element, pseudoElement);
  }

  public async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    return await FrameEnvironment.getComputedVisibility(node);
  }

  // @deprecated 2021-04-30: Replaced with getComputedVisibility
  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    return await this.getComputedVisibility(element as any).then(x => x.isVisible);
  }

  public async getJsValue<T>(path: string): Promise<T> {
    const coreFrame = await getCoreFrameEnvironment(this);
    return coreFrame.getJsValue<T>(path);
  }

  public async waitForPaintingStable(options?: IWaitForOptions): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this);
    await coreFrame.waitForLoad(LocationStatus.PaintingStable, options);
  }

  public async waitForLoad(status: LocationStatus, options?: IWaitForOptions): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this);
    await coreFrame.waitForLoad(status, options);
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<void> {
    if (!element) throw new Error('Element being waited for is null');
    const { awaitedPath } = awaitedPathState.getState(element);
    const coreFrame = await getCoreFrameEnvironment(this);
    await coreFrame.waitForElement(awaitedPath.toJSON(), options);
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<void> {
    const coreFrame = await getCoreFrameEnvironment(this);
    await coreFrame.waitForLocation(trigger, options);
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

  public static getComputedStyle(
    element: IElementIsolate,
    pseudoElement?: string,
  ): CSSStyleDeclaration {
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

  public static async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    if (!node) return { isVisible: false, nodeExists: false };
    return await AwaitedHandler.runMethod(awaitedPathState, node, getComputedVisibilityFnName, []);
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
// CREATE

export function createFrame(
  secretAgent: Agent,
  tab: Tab,
  coreFrame: Promise<CoreFrameEnvironment>,
): FrameEnvironment {
  return new FrameEnvironment(secretAgent, tab, coreFrame);
}
