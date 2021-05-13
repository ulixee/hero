import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
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
import Response from 'awaited-dom/impl/official-klasses/Response';
import { IElementIsolate, INodeIsolate } from 'awaited-dom/base/interfaces/isolate';
import { INodeVisibility } from '@secret-agent/interfaces/INodeVisibility';
import {
  getComputedStyleFnName,
  getComputedVisibilityFnName,
} from '@secret-agent/interfaces/jsPathFnNames';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Agent from './Agent';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import FrozenTab from './FrozenTab';

const { getState, setState } = StateMachine<FrozenFrameEnvironment, IState>();
const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions }
>();

export interface IState {
  secretAgent: Agent;
  tab: FrozenTab;
  coreFrame: Promise<CoreFrameEnvironment>;
}

const propertyKeys: (keyof FrozenFrameEnvironment)[] = [
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

export default class FrozenFrameEnvironment {
  constructor(secretAgent: Agent, tab: FrozenTab, coreFrame: Promise<CoreFrameEnvironment>) {
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

  public async getComputedStyle(
    element: IElementIsolate,
    pseudoElement?: string,
  ): Promise<CSSStyleDeclaration & { [style: string]: string }> {
    const { awaitedPath } = awaitedPathState.getState(element);
    const coreFrame = await getCoreFrameEnvironment(this);
    const path = awaitedPath.addMethod(element, getComputedStyleFnName, pseudoElement);
    const result = await coreFrame.execJsPath<Record<string, string>>(path.toJSON());

    const awaitedOptions = { ...getState(this) };
    const declaration = createCSSStyleDeclaration<IAwaitedOptions>(awaitedPath, awaitedOptions);
    Object.assign(declaration, result.value);
    return declaration;
  }

  public async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    if (!node) return { isVisible: false, nodeExists: false };
    const { awaitedPath } = awaitedPathState.getState(node);
    const path = awaitedPath.addMethod(node, getComputedVisibilityFnName);
    const coreFrame = await getCoreFrameEnvironment(this);
    const result = await coreFrame.execJsPath<INodeVisibility>(path.toJSON());
    return result.value;
  }

  // @deprecated 2021-04-30: Replaced with getComputedVisibility
  public async isElementVisible(element: IElementIsolate): Promise<boolean> {
    return await this.getComputedVisibility(element as any).then(x => x.isVisible);
  }

  public async getJsValue<T>(path: string): Promise<T> {
    const coreFrame = await getCoreFrameEnvironment(this);
    return coreFrame.getJsValue<T>(path);
  }

  public toJSON(): any {
    // return empty so we can avoid infinite "stringifying" in jest
    return {
      type: this.constructor.name,
    };
  }
}

export function getFrameState(object: any): IState {
  return getState(object);
}

export function getCoreFrameEnvironment(
  frameEnvironment: FrozenFrameEnvironment,
): Promise<CoreFrameEnvironment> {
  return getState(frameEnvironment).coreFrame;
}
