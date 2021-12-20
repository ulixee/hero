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
import { runMagicSelector, runMagicSelectorAll } from '@ulixee/hero-interfaces/jsPathFnNames';
import IMagicSelectorOptions from '@ulixee/hero-interfaces/IMagicSelectorOptions';

const { log } = Log(module);

export class JsPath {
  public hasNewExecJsPathHistory = false;
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

  public exec<T>(jsPath: IJsPath, containerOffset: IPoint): Promise<IExecJsPathResult<T>> {
    if (this.isMagicSelectorPath(jsPath)) this.emitMagicSelector(jsPath[0] as any);

    return this.runJsPath<T>(`exec`, jsPath, containerOffset);
  }

  public waitForElement(
    jsPath: IJsPath,
    containerOffset: IPoint,
    waitForVisible: boolean,
    timeoutMillis: number,
  ): Promise<IExecJsPathResult<INodeVisibility>> {
    if (this.isMagicSelectorPath(jsPath)) this.emitMagicSelector(jsPath[0] as any);

    return this.runJsPath<INodeVisibility>(
      `waitForElement`,
      jsPath,
      containerOffset,
      waitForVisible,
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
  ): Promise<IJsPathResult[]> {
    if (!jsPaths?.length) return [];

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

    if (this.recordJsPaths && fnName === 'exec') {
      this.recordExecResult(jsPath, result);
    }
    return result;
  }

  private recordExecResult(
    jsPath: IJsPath,
    result: IExecJsPathResult<any>,
    isLiveQuery = true,
  ): void {
    let sourceIndex: number;
    if (isLiveQuery) this.hasNewExecJsPathHistory = true;
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

    const event = query === runMagicSelectorAll ? 'magic-selector-all' : 'magic-selector';
    this.frameEnvironment.tab.emit(event, { options, frame: this.frameEnvironment });
    jsPath[1] = options;
  }

  private isMagicSelectorPath(jsPath: IJsPath): boolean {
    return (
      Array.isArray(jsPath[0]) &&
      (jsPath[0][0] === runMagicSelector || jsPath[0][0] === runMagicSelectorAll)
    );
  }
}

export interface IJsPathHistory {
  jsPath: IJsPath;
  sourceIndex?: number;
}
