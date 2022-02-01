import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import * as Util from 'util';
import StateMachine from 'awaited-dom/base/StateMachine';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import CSSStyleDeclaration from 'awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import {
  createCSSStyleDeclaration,
  createResponse,
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
import Hero from './Hero';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import FrozenTab from './FrozenTab';
import * as AwaitedHandler from './SetupAwaitedHandler';
import InternalProperties from './InternalProperties';

const stateMachine = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions }
>();

const propertyKeys: (keyof FrozenFrameEnvironment)[] = [
  'frameId',
  'url',
  'name',
  'parentFrameId',
  'document',
  'Request',
];

export default class FrozenFrameEnvironment {
  #hero: Hero;
  #tab: FrozenTab;
  #prefetchedJsPathsPromise: Promise<Map<string, IJsPathResult>>;
  #coreFramePromise: Promise<CoreFrameEnvironment>;

  constructor(
    hero: Hero,
    tab: FrozenTab,
    coreFramePromise: Promise<CoreFrameEnvironment>,
    prefetchedJsPathsPromise: Promise<IJsPathResult[]>,
  ) {
    this.#hero = hero;
    this.#tab = tab;
    this.#coreFramePromise = coreFramePromise;
    this.#prefetchedJsPathsPromise = prefetchedJsPathsPromise.then(x => {
      const resultMap = new Map<string, IJsPathResult>();
      for (let i = 0; i < x.length; i += 1) {
        const result = x[i];
        result.index = i;
        resultMap.set(JSON.stringify(result.jsPath), result);
      }
      return resultMap;
    });
    InternalProperties.set(this, { coreFramePromise });
  }

  get #awaitedOptions(): IAwaitedOptions & {
    prefetchedJsPaths?: Promise<Map<string, IJsPathResult>>;
  } {
    return {
      coreFrame: this.#coreFramePromise,
      prefetchedJsPaths: this.#prefetchedJsPathsPromise,
    };
  }

  public get isMainFrame(): Promise<boolean> {
    return this.parentFrameId.then(x => !x);
  }

  public get frameId(): Promise<number> {
    return this.#coreFramePromise.then(x => x.frameId);
  }

  public get url(): Promise<string> {
    return this.#coreFramePromise.then(x => x.getUrl());
  }

  public get name(): Promise<string> {
    return this.#coreFramePromise.then(x => x.getFrameMeta()).then(x => x.name);
  }

  public get parentFrameId(): Promise<number | null> {
    return this.#coreFramePromise.then(x => x.getFrameMeta()).then(x => x.parentFrameId);
  }

  public get document(): SuperDocument {
    const awaitedPath = new AwaitedPath(null, 'document');
    return createSuperDocument<IAwaitedOptions>(awaitedPath, this.#awaitedOptions) as SuperDocument;
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
    return createResponse(awaitedPath, this.#awaitedOptions);
  }

  public async getComputedStyle(
    element: IElementIsolate,
    pseudoElement?: string,
  ): Promise<CSSStyleDeclaration & { [style: string]: string }> {
    const { awaitedPath, coreFrame, awaitedOptions } = await AwaitedHandler.getAwaitedState(
      stateMachine,
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
      stateMachine,
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
      stateMachine,
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
    const coreFrame = await this.#coreFramePromise;
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
