import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
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
import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import Response from 'awaited-dom/impl/official-klasses/Response';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import { IElementIsolate } from 'awaited-dom/base/interfaces/isolate';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Agent from './Agent';
import { getAwaitedPathAsMethodArg } from './SetupAwaitedHandler';
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
    initializeConstantsAndProperties(this, [], propertyKeys);
    setState(this, {
      secretAgent,
      tab,
      coreFrame,
    });
  }

  public get isMainFrame(): Promise<boolean> {
    return this.parentFrameId.then(x => !x);
  }

  public get frameId(): Promise<string> {
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

  public get parentFrameId(): Promise<string | null> {
    return getCoreFrameEnvironment(this)
      .then(x => x.getFrameMeta())
      .then(x => x.parentFrameId);
  }

  public get cookieStorage(): CookieStorage {
    return createCookieStorage(getCoreFrameEnvironment(this));
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath('document');
    const awaitedOptions = { ...getState(this) };
    return createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions) as SuperDocument;
  }

  public get localStorage(): Storage {
    const awaitedPath = new AwaitedPath('localStorage');
    const awaitedOptions = { ...getState(this) };
    return createStorage<IAwaitedOptions>(awaitedPath, awaitedOptions) as Storage;
  }

  public get sessionStorage(): Storage {
    const awaitedPath = new AwaitedPath('sessionStorage');
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
    const attachedState = await coreFrame.fetch(requestInput, init);

    const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
    return createResponse(awaitedPath, { ...getState(this) });
  }

  public async getFrameEnvironment(element: IElementIsolate): Promise<FrameEnvironment | null> {
    const { tab } = getState(this);
    return await tab.getFrameEnvironment(element);
  }

  public getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration {
    const { awaitedPath: elementAwaitedPath } = awaitedPathState.getState(element);
    const awaitedPath = new AwaitedPath('window', [
      'getComputedStyle',
      getAwaitedPathAsMethodArg(elementAwaitedPath),
      pseudoElement,
    ]);
    const awaitedOptions = { ...getState(this) };
    return createCSSStyleDeclaration<IAwaitedOptions>(
      awaitedPath,
      awaitedOptions,
    ) as CSSStyleDeclaration;
  }

  public async getJsValue<T>(path: string): Promise<T> {
    const coreFrame = await getCoreFrameEnvironment(this);
    return coreFrame.getJsValue<T>(path);
  }

  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    const { awaitedPath } = awaitedPathState.getState(element);
    const coreFrame = await getCoreFrameEnvironment(this);
    return coreFrame.isElementVisible(awaitedPath.toJSON());
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
    // return empty so we can
    return {
      type: 'FrameEnvironment',
    };
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
