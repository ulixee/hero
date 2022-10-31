import { INodePointer, IElementRect, IJsPath, INodeVisibility } from '@unblocked-web/js-path';
import IExecJsPathResult from '@unblocked-web/specifications/agent/browser/IExecJsPathResult';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IPoint from '@unblocked-web/specifications/agent/browser/IPoint';
import { isMousePositionXY } from '@unblocked-web/specifications/agent/interact/IInteractions';
import IJsPathFunctions, {
  getClientRectFnName,
  getComputedVisibilityFnName,
  getNodePointerFnName,
  getNodeIdFnName,
} from '@unblocked-web/specifications/agent/browser/IJsPathFunctions';
import { LoadStatus } from '@unblocked-web/specifications/agent/browser/Location';
import Frame from './Frame';
import InjectedScriptError from '../errors/InjectedScriptError';
import InjectedScripts from './InjectedScripts';

interface IJsPathSource {
  parentNodeId?: number;
  isFromIterable: boolean;
  jsPath: IJsPath;
}

export type ISerializable =
  | number
  | string
  | boolean
  | null
  | ISerializable[]
  | IJSONObject
  | IPoint;
interface IJSONObject {
  [key: string]: ISerializable;
}

export class JsPath implements IJsPathFunctions {
  private readonly frame: Frame;
  private readonly logger: IBoundLog;
  private readonly clientRectByNodePointerId = new Map<number, IElementRect>();
  private readonly nodeIdRedirectToNewNodeId: { [nodeId: number]: number } = {};

  private nodeIdToJsPathSource = new Map<number, IJsPathSource>();

  constructor(frame: Frame, logger: IBoundLog) {
    this.frame = frame;
    this.logger = logger.createChild(module);
  }

  public getLastClientRect(nodeId: number): IElementRect {
    return this.clientRectByNodePointerId.get(nodeId);
  }

  public getClientRect(
    jsPath: IJsPath,
    includeNodeVisibility?: boolean,
  ): Promise<IExecJsPathResult<IElementRect>> {
    const fnCall = this.getJsPathMethod(jsPath);
    if (fnCall !== getClientRectFnName) {
      jsPath = [...jsPath, [getClientRectFnName, includeNodeVisibility]];
    }
    return this.exec<IElementRect>(jsPath);
  }

  public async exec<T>(jsPath: IJsPath, timeoutMs?: number): Promise<IExecJsPathResult<T>> {
    await this.frame.navigationsObserver.waitForLoad(LoadStatus.JavascriptReady, {
      timeoutMs: timeoutMs ?? 30e3,
      doNotIncrementMarker: true,
    });
    const containerOffset = await this.frame.getContainerOffset();
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

  public getNodePointerId(jsPath: IJsPath): Promise<number> {
    const fnCall = this.getJsPathMethod(jsPath);
    if (fnCall !== getNodeIdFnName && fnCall !== getNodeIdFnName) {
      jsPath = [...jsPath, [getNodeIdFnName]];
    }
    return this.runJsPath<number>(`exec`, jsPath).then(x => x.value);
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

  public getNodeVisibility(jsPath: IJsPath): Promise<INodeVisibility> {
    const fnCall = this.getJsPathMethod(jsPath);
    if (fnCall !== getComputedVisibilityFnName) {
      jsPath = [...jsPath, [getComputedVisibilityFnName]];
    }
    return this.runJsPath<INodeVisibility>(`exec`, jsPath).then(x => x.value);
  }

  public simulateOptionClick(jsPath: IJsPath): Promise<IExecJsPathResult<boolean>> {
    return this.runJsPath(`simulateOptionClick`, jsPath);
  }

  public getSourceJsPath(nodePointer: INodePointer): IJsPath {
    const path: IJsPath = [];
    const history = this.getJsPathHistoryForNode(nodePointer.id);
    for (const entry of history) {
      const jsPath = entry.jsPath;
      if (typeof jsPath[0] === 'number') {
        path.push(...jsPath.slice(1));
      } else {
        path.push(...jsPath);
      }
    }
    return path;
  }

  protected replaceRedirectedJsPathNodePointer(jsPath: IJsPath): void {
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

  private async runJsPath<T>(
    fnName: string,
    jsPath: IJsPath,
    ...args: ISerializable[]
  ): Promise<IExecJsPathResult<T>> {
    this.replaceRedirectedJsPathNodePointer(jsPath);
    const result = await this.runInjectedScriptFn<IExecJsPathResult<T>>(
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

  private async runInjectedScriptFn<T>(fnName: string, ...args: ISerializable[]): Promise<T> {
    const serializedFn = `${fnName}(${args
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ')})`;
    const result = await this.frame.evaluate<T>(
      serializedFn,
      this.frame.page.installJsPathIntoIsolatedContext,
    );

    if ((result as any)?.error) {
      this.logger.error(fnName, { result });
      throw new InjectedScriptError((result as any).error as string);
    } else {
      return result as T;
    }
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
    // eslint-disable-next-line no-cond-assign
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
    const { id, iterableItems, iterableIsNodePointers } = result.nodePointer;
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
    if (iterableIsNodePointers) {
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
