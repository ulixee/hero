import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IExecJsPathResult from '@secret-agent/interfaces/IExecJsPathResult';
import IWindowOffset from '@secret-agent/interfaces/IWindowOffset';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import { INodeVisibility } from '@secret-agent/interfaces/INodeVisibility';
import INodePointer from 'awaited-dom/base/INodePointer';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';

interface IJsPathHistory {
  jsPath: IJsPath;
  sourceIndex?: number;
}

const { log } = Log(module);
export class JsPath {
  public readonly execHistory: IJsPathHistory[] = [];

  private readonly frameEnvironment: FrameEnvironment;
  private readonly logger: IBoundLog;
  private readonly recordJsPaths: boolean = false;

  private nodeIdToHistoryLocation = new Map<
    number,
    { sourceIndex: number; isFromIterable: boolean }
  >();

  constructor(frameEnvironment: FrameEnvironment, recordJsPaths: boolean) {
    this.frameEnvironment = frameEnvironment;
    this.recordJsPaths = recordJsPaths;
    this.logger = log.createChild(module, {
      sessionId: frameEnvironment.session.id,
      frameId: frameEnvironment.id,
    });
  }

  public exec<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return this.runJsPath<T>(`exec`, jsPath);
  }

  public waitForElement(
    jsPath: IJsPath,
    waitForVisible: boolean,
    timeoutMillis: number,
  ): Promise<IExecJsPathResult<INodeVisibility>> {
    return this.runJsPath<INodeVisibility>(`waitForElement`, jsPath, waitForVisible, timeoutMillis);
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
  ): Promise<{ jsPath: IJsPath; result: IExecJsPathResult<any> }[]> {
    const results = await this.frameEnvironment.runIsolatedFn<
      { jsPath: IJsPath; result: IExecJsPathResult<any> }[]
    >(`${InjectedScripts.JsPath}.execJsPaths`, jsPaths as any);

    for (const { result } of results) {
      if (result?.isValueSerialized === true) {
        delete result.isValueSerialized;
        result.value = TypeSerializer.revive(result.value, 'BROWSER');
      }
    }
    return results;
  }

  private async runJsPath<T>(
    fnName: string,
    jsPath: IJsPath,
    ...args: Serializable[]
  ): Promise<IExecJsPathResult<T>> {
    const result = await this.frameEnvironment.runIsolatedFn<IExecJsPathResult<T>>(
      `${InjectedScripts.JsPath}.${fnName}`,
      jsPath,
      ...args,
    );
    if (result.pathError) {
      throw new InjectedScriptError(result.pathError.error, result.pathError.pathState);
    } else if (result?.isValueSerialized === true) {
      delete result.isValueSerialized;
      result.value = TypeSerializer.revive(result.value, 'BROWSER');
    }

    if (this.recordJsPaths && fnName === 'exec') {
      this.recordExecResult(jsPath, result);
    }
    return result;
  }

  private recordExecResult(jsPath: IJsPath, result: IExecJsPathResult<any>): void {
    let sourceIndex: number;
    // if jspath starts with an id, this is a nested query
    if (typeof jsPath[0] === 'number') {
      const id = jsPath[0];
      const queryIndex = this.nodeIdToHistoryLocation.get(id);
      const operator = queryIndex.isFromIterable ? '*.' : '.';
      const plan = <IJsPathHistory>{
        jsPath: [operator, ...jsPath.slice(1)],
        sourceIndex: queryIndex.sourceIndex,
      };
      const stringified = JSON.stringify(plan.jsPath);
      const match = this.execHistory.find(
        x => JSON.stringify(x.jsPath) === stringified && x.sourceIndex === queryIndex.sourceIndex,
      );
      if (match) {
        sourceIndex = this.execHistory.indexOf(match);
      } else {
        this.execHistory.push(plan);
        sourceIndex = this.execHistory.length - 1;
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
}
