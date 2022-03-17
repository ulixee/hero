import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import IWindowOffset from '@ulixee/hero-interfaces/IWindowOffset';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import INodePointer from 'awaited-dom/base/INodePointer';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';
import {
  getClientRectFnName,
  getComputedVisibilityFnName,
  getNodePointerFnName,
} from '@ulixee/hero-interfaces/jsPathFnNames';
import IElementRect from '@ulixee/hero-interfaces/IElementRect';
import { isMousePositionXY } from '@ulixee/hero-interfaces/IInteractions';

const { log } = Log(module);

interface IJsPathSource {
  parentNodeId?: number;
  isFromIterable: boolean;
  jsPath: IJsPath;
}

export class JsPath {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly logger: IBoundLog;
  private readonly clientRectByNodePointerId = new Map<number, IElementRect>();
  private readonly nodeIdRedirectToNewNodeId: { [nodeId: number]: number } = {};

  private nodeIdToJsPathSource = new Map<number, IJsPathSource>();

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
    return this.runJsPath<T>(`exec`, jsPath, containerOffset);
  }

  public async reloadJsPath<T>(
    jsPath: IJsPath,
    containerOffset: IPoint,
  ): Promise<IExecJsPathResult<T>> {
    if (typeof jsPath[0] === 'number' && !isMousePositionXY(jsPath.slice(0, 2))) {
      const paths = this.getJsPathHistoryForNode(jsPath[0]);
      for (const path of paths) {
        const result = await this.getNodePointer(path.jsPath, containerOffset);
        const nodeId = result.nodePointer?.id;
        if (nodeId && nodeId !== path.nodeId) {
          this.logger.info('JsPath.nodeRedirectFound', {
            sourceNodeId: path.nodeId,
            newNodeId: nodeId,
            jsPath: path.jsPath,
          });
          this.nodeIdRedirectToNewNodeId[path.nodeId] = nodeId;
        }
      }
    }

    return this.getNodePointer(jsPath, containerOffset);
  }

  public getNodePointer<T>(
    jsPath: IJsPath,
    containerOffset: IPoint = { x: 0, y: 0 },
  ): Promise<IExecJsPathResult<T>> {
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

  public simulateOptionClick(jsPath: IJsPath): Promise<IExecJsPathResult<boolean>> {
    return this.runJsPath(`simulateOptionClick`, jsPath);
  }

  public getWindowOffset(): Promise<IWindowOffset> {
    return this.frameEnvironment.runIsolatedFn(`${InjectedScripts.JsPath}.getWindowOffset`);
  }

  public waitForScrollStop(timeoutMillis = 2e3): Promise<[scrollX: number, scrollY: number]> {
    return this.frameEnvironment.runIsolatedFn(
      `${InjectedScripts.JsPath}.waitForScrollStop`,
      timeoutMillis,
    );
  }

  public getNodePath(nodePointer: INodePointer): IJsPath {
    const path: IJsPath = [];
    const history = this.getJsPathHistoryForNode(nodePointer.id);
    for (const entry of history) {
      const jsPath = entry.jsPath;
      if (typeof jsPath[0] === 'number') {
        path.push(...jsPath.slice(1))
      } else {
        path.push(...jsPath);
      }
    }
    return path;
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
    jsPath: IJsPath;
  }[] {
    const paths: {
      nodeId: number;
      jsPath: IJsPath;
    }[] = [];

    let sourcePath: IJsPathSource;
    while ((sourcePath = this.nodeIdToJsPathSource.get(nodeId))) {
      paths.unshift({ nodeId, jsPath: sourcePath.jsPath });
      nodeId = sourcePath.parentNodeId;
      if (!nodeId) break;
    }
    return paths;
  }

  private recordExecResult(jsPath: IJsPath, result: IExecJsPathResult<any>): void {
    if (!result.nodePointer) return;

    // try to record last known position
    const method = this.getJsPathMethod(jsPath);
    const { id, iterableItems, iterableIsState } = result.nodePointer;
    const parentNodeId = typeof jsPath[0] === 'number' ? jsPath[0] : undefined;

    if (method === getClientRectFnName) {
      this.clientRectByNodePointerId.set(result.nodePointer.id, result.value);
    } else if (method === getComputedVisibilityFnName) {
      const clientRect = (result.value as INodeVisibility).boundingClientRect;
      this.clientRectByNodePointerId.set(result.nodePointer.id, clientRect);
    }

    const cleanJsPath = [...jsPath];
    if (method && method.startsWith('__')) cleanJsPath.pop();

    const queryIndex = this.nodeIdToJsPathSource.get(id);
    if (!queryIndex) {
      this.nodeIdToJsPathSource.set(id, {
        isFromIterable: false,
        parentNodeId,
        jsPath: cleanJsPath,
      });
    }
    if (iterableIsState) {
      for (let i = 0; i < iterableItems.length; i += 1) {
        const nodePointer = iterableItems[i] as INodePointer;
        if (this.nodeIdToJsPathSource.has(nodePointer.id)) continue;
        this.nodeIdToJsPathSource.set(nodePointer.id, {
          isFromIterable: true,
          jsPath: [...cleanJsPath, String(i)],
          parentNodeId,
        });
      }
    }
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
