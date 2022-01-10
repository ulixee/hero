import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import IWindowOffset from '@ulixee/hero-interfaces/IWindowOffset';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import INodePointer from 'awaited-dom/base/INodePointer';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';
import {
  getClientRectFnName,
  getComputedVisibilityFnName,
  getNodePointerFnName,
  runMagicSelectorAllFnName,
  runMagicSelectorFnName,
} from '@ulixee/hero-interfaces/jsPathFnNames';
import IMagicSelectorOptions from '@ulixee/hero-interfaces/IMagicSelectorOptions';
import IElementRect from '@ulixee/hero-interfaces/IElementRect';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';

const { log } = Log(module);

export class JsPath {
  public hasNewExecJsPathHistory = false;
  public readonly execHistory: IJsPathHistory[] = [];

  private readonly execHistoryIndexByKey: { [jsPath_sourceIndex: string]: number } = {};
  private readonly frameEnvironment: FrameEnvironment;
  private readonly logger: IBoundLog;
  private readonly clientRectByNodePointerId = new Map<number, IElementRect>();
  private readonly nodeIdRedirectToNewNodeId: { [nodeId: number]: number } = {};

  private nodeIdToHistoryLocation = new Map<
    number,
    { sourceIndex: number; isFromIterable: boolean }
  >();

  constructor(frameEnvironment: FrameEnvironment) {
    this.frameEnvironment = frameEnvironment;
    this.logger = log.createChild(module, {
      sessionId: frameEnvironment.session.id,
      frameId: frameEnvironment.id,
    });
  }

  public getLastClientRect(nodeId: number): IElementRect {
    return this.clientRectByNodePointerId.get(nodeId);
  }

  public exec<T>(jsPath: IJsPath, containerOffset: IPoint): Promise<IExecJsPathResult<T>> {
    if (this.isMagicSelectorPath(jsPath)) this.emitMagicSelector(jsPath[0] as any);
    return this.runJsPath<T>(`exec`, jsPath, containerOffset);
  }

  public async reloadJsPath<T>(
    jsPath: IJsPath,
    containerOffset: IPoint,
  ): Promise<IExecJsPathResult<T>> {
    if (typeof jsPath[0] === 'number') {
      const paths = this.getJsPathHistoryForNode(jsPath[0]);
      for (const path of paths) {
        const result = await this.runJsPath<any>('exec', path.jsPath, containerOffset);
        const nodeId = result.nodePointer?.id;
        if (nodeId !== path.nodeId) {
          this.logger.info('JsPath.nodeRedirectFound', {
            sourceNodeId: path.nodeId,
            newNodeId: nodeId,
            jsPath: path.jsPath,
          });
          this.nodeIdRedirectToNewNodeId[path.nodeId] = nodeId;
        }
      }
    }

    // add a node pointer call onto the end if needed
    const fnCall = this.getJsPathMethod(jsPath);
    if (fnCall !== getClientRectFnName && fnCall !== getNodePointerFnName) {
      jsPath = [...jsPath, [getNodePointerFnName]];
    }
    return this.runJsPath<T>(`exec`, jsPath, containerOffset);
  }

  public replaceRedirectedJsPathNodePointer(jsPath: IJsPath): void {
    if (typeof jsPath[0] === 'number') {
      let id = jsPath[0];
      while (id) {
        const nextId = this.nodeIdRedirectToNewNodeId[id];
        if (nextId === undefined || nextId === id) break;
        id = nextId;
      }
      jsPath[0] = id;
    }
  }

  public waitForElement(
    jsPath: IJsPath,
    containerOffset: IPoint,
    options: IWaitForElementOptions,
    timeoutMillis: number,
  ): Promise<IExecJsPathResult<INodeVisibility>> {
    if (this.isMagicSelectorPath(jsPath)) this.emitMagicSelector(jsPath[0] as any);

    return this.runJsPath<INodeVisibility>(
      `waitForElement`,
      jsPath,
      containerOffset,
      options as any,
      timeoutMillis,
    );
  }

  public simulateOptionClick(jsPath: IJsPath): Promise<IExecJsPathResult<boolean>> {
    return this.runJsPath(`simulateOptionClick`, jsPath);
  }

  public getWindowOffset(): Promise<IWindowOffset> {
    return this.frameEnvironment.runIsolatedFn(`${InjectedScripts.JsPath}.getWindowOffset`);
  }

  public waitForScrollOffset(
    scrollX: number,
    scrollY: number,
    timeoutMillis = 2e3,
  ): Promise<boolean> {
    return this.frameEnvironment.runIsolatedFn(
      `${InjectedScripts.JsPath}.waitForScrollOffset`,
      [scrollX, scrollY],
      timeoutMillis,
    );
  }

  public async runJsPaths(
    jsPaths: IJsPathHistory[],
    containerOffset: IPoint,
    shouldRedirectRemovedNodes = true,
  ): Promise<IJsPathResult[]> {
    if (!jsPaths?.length) return [];

    if (shouldRedirectRemovedNodes && Object.keys(this.nodeIdRedirectToNewNodeId)) {
      for (const path of jsPaths) {
        this.replaceRedirectedJsPathNodePointer(path.jsPath);
      }
    }

    const results = await this.frameEnvironment.runIsolatedFn<IJsPathResult[]>(
      `${InjectedScripts.JsPath}.execJsPaths`,
      jsPaths as any,
      containerOffset,
    );

    for (const { result, jsPath } of results) {
      if (result?.isValueSerialized === true) {
        result.isValueSerialized = undefined;
        result.value = TypeSerializer.revive(result.value, 'BROWSER');
      }
      this.recordExecResult(jsPath, result, false);
    }
    return results;
  }

  private async runJsPath<T>(
    fnName: string,
    jsPath: IJsPath,
    ...args: Serializable[]
  ): Promise<IExecJsPathResult<T>> {
    this.replaceRedirectedJsPathNodePointer(jsPath);
    const result = await this.frameEnvironment.runIsolatedFn<IExecJsPathResult<T>>(
      `${InjectedScripts.JsPath}.${fnName}`,
      jsPath,
      ...args,
    );
    if (result.pathError) {
      throw new InjectedScriptError(result.pathError.error, result.pathError.pathState);
    } else if (result?.isValueSerialized === true) {
      result.isValueSerialized = undefined;
      result.value = TypeSerializer.revive(result.value, 'BROWSER');
    }

    if (fnName === 'exec' || fnName === 'waitForElement') {
      this.recordExecResult(jsPath, result);
    }
    return result;
  }

  private getJsPathHistoryForNode(nodeId: number): {
    nodeId: number;
    redirectedNodeId?: number;
    jsPath: IJsPath;
  }[] {
    const originalPath = this.nodeIdToHistoryLocation.get(nodeId);
    let sourceIndex = originalPath.sourceIndex;
    const paths: ReturnType<JsPath['getJsPathHistoryForNode']> = [];

    let parentNodeId = nodeId;
    while (sourceIndex !== undefined) {
      const sourcePath = this.execHistory[sourceIndex];
      if (typeof parentNodeId === 'number') {
        paths.unshift({ nodeId: parentNodeId, jsPath: sourcePath.jsPath });
      }
      sourceIndex = sourcePath.sourceIndex;
      if (sourceIndex) parentNodeId = sourcePath.jsPath[0] as number;
    }
    return paths;
  }

  private recordExecResult(
    jsPath: IJsPath,
    result: IExecJsPathResult<any>,
    isLiveQuery = true,
  ): void {
    let sourceIndex: number;
    if (isLiveQuery) this.hasNewExecJsPathHistory = true;

    if (result.nodePointer && isLiveQuery) {
      // try to record last known position
      const method = this.getJsPathMethod(jsPath);
      if (method === getClientRectFnName) {
        this.clientRectByNodePointerId.set(result.nodePointer.id, result.value);
      } else if (method === getComputedVisibilityFnName) {
        const clientRect = (result.value as INodeVisibility).boundingClientRect;
        this.clientRectByNodePointerId.set(result.nodePointer.id, clientRect);
      }
    }

    // if jspath starts with an id, this is a nested query
    if (typeof jsPath[0] === 'number') {
      const id = jsPath[0];

      const queryIndex = this.nodeIdToHistoryLocation.get(id);
      if (queryIndex === undefined) return;
      const operator = queryIndex.isFromIterable ? '*.' : '.';
      const operatorPath = [operator, ...jsPath.slice(1)];
      const key = `${JSON.stringify(operatorPath)}_${queryIndex.sourceIndex}`;

      sourceIndex = this.execHistoryIndexByKey[key];
      if (sourceIndex === undefined) {
        this.execHistory.push({
          jsPath: operatorPath,
          sourceIndex: queryIndex.sourceIndex,
        });
        sourceIndex = this.execHistory.length - 1;
        this.execHistoryIndexByKey[key] = sourceIndex;
      }
    } else {
      this.execHistory.push({
        jsPath,
      });
      sourceIndex = this.execHistory.length - 1;
    }

    if (result.nodePointer) {
      const { id, iterableItems, iterableIsState } = result.nodePointer;

      const queryIndex = this.nodeIdToHistoryLocation.get(id);
      if (!queryIndex) {
        this.nodeIdToHistoryLocation.set(id, {
          isFromIterable: false,
          sourceIndex,
        });
      }
      if (iterableIsState) {
        for (const nodePointer of iterableItems as INodePointer[]) {
          this.nodeIdToHistoryLocation.set(nodePointer.id, {
            isFromIterable: true,
            sourceIndex,
          });
        }
      }
    }
  }

  private emitMagicSelector(
    jsPath: [query: string, selectorOrOptions: string | IMagicSelectorOptions],
  ): void {
    const [query, selectorOrOptions] = jsPath;
    let options = (selectorOrOptions as IMagicSelectorOptions) ?? {
      querySelectors: [],
      minMatchingSelectors: 1,
    };
    if (selectorOrOptions && typeof selectorOrOptions === 'string') {
      options = { minMatchingSelectors: 1, querySelectors: [selectorOrOptions] };
    }

    const event = query === runMagicSelectorAllFnName ? 'magic-selector-all' : 'magic-selector';
    this.frameEnvironment.tab.emit(event, { options, frame: this.frameEnvironment });
    jsPath[1] = options;
  }

  private isMagicSelectorPath(jsPath: IJsPath): boolean {
    return (
      Array.isArray(jsPath[0]) &&
      (jsPath[0][0] === runMagicSelectorFnName || jsPath[0][0] === runMagicSelectorAllFnName)
    );
  }

  private getJsPathMethod(jsPath: IJsPath): string {
    const last = jsPath[jsPath.length - 1];
    return Array.isArray(last) ? last[0] : '';
  }
}

export interface IJsPathHistory {
  jsPath: IJsPath;
  sourceIndex?: number;
}
