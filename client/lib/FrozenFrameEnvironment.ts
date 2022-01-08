import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import * as Util from 'util';
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
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import {
  getComputedStyleFnName,
  getComputedVisibilityFnName,
} from '@ulixee/hero-interfaces/jsPathFnNames';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import RequestGenerator, { getRequestIdOrUrl } from './Request';
import CookieStorage, { createCookieStorage } from './CookieStorage';
import Hero from './Hero';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import FrozenTab from './FrozenTab';
import * as AwaitedHandler from './SetupAwaitedHandler';

const { getState, setState } = StateMachine<FrozenFrameEnvironment, IState>();
const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions }
>();

export interface IState {
  hero: Hero;
  tab: FrozenTab;
  coreFrame: Promise<CoreFrameEnvironment>;
  prefetchedJsPaths: Promise<Map<string, IJsPathResult>>;
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
  constructor(
    hero: Hero,
    tab: FrozenTab,
    coreFrame: Promise<CoreFrameEnvironment>,
    prefetchedJsPaths: Promise<IJsPathResult[]>,
  ) {
    setState(this, {
      hero,
      tab,
      coreFrame,
      prefetchedJsPaths: prefetchedJsPaths.then(x => {
        const resultMap = new Map<string, IJsPathResult>();
        for (let i = 0; i < x.length; i += 1) {
          const result = x[i];
          result.index = i;
          resultMap.set(JSON.stringify(result.jsPath), result);
        }
        return resultMap;
      }),
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

  public async getComputedStyle(
    element: IElementIsolate,
    pseudoElement?: string,
  ): Promise<CSSStyleDeclaration & { [style: string]: string }> {
    const { awaitedPath, coreFrame, awaitedOptions } = await AwaitedHandler.getAwaitedState(
      awaitedPathState,
      element,
    );
    const newPath = awaitedPath.addMethod(element, getComputedStyleFnName, pseudoElement);
    const result = await AwaitedHandler.execJsPath<Record<string, string>>(
      coreFrame,
      awaitedOptions,
      newPath.toJSON(),
    );
    const declaration = createCSSStyleDeclaration<IAwaitedOptions>(newPath, awaitedOptions);
    const attributes = AwaitedHandler.cleanResult(
      awaitedPathState,
      declaration,
      result,
      new Error().stack,
    );
    Object.assign(declaration, attributes);
    return declaration;
  }

  public async getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility> {
    if (!node) return { isVisible: false, nodeExists: false, isClickable: false };
    return await AwaitedHandler.delegate.runMethod<INodeVisibility, INodeIsolate>(
      awaitedPathState,
      node,
      getComputedVisibilityFnName,
      [],
    );
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

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
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
