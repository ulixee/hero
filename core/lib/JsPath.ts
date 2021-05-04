import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IExecJsPathResult from '@secret-agent/interfaces/IExecJsPathResult';
import IElementRect from '@secret-agent/interfaces/IElementRect';
import IWindowOffset from '@secret-agent/interfaces/IWindowOffset';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import { INodeVisibility } from '@secret-agent/interfaces/INodeVisibility';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';

const { log } = Log(module);
export class JsPath {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly jsPath: IJsPath;
  private readonly logger: IBoundLog;

  constructor(frameEnvironment: FrameEnvironment, jsPath?: IJsPath) {
    this.frameEnvironment = frameEnvironment;
    this.logger = log.createChild(module, {
      sessionId: frameEnvironment.session.id,
      frameId: frameEnvironment.id,
    });
    this.jsPath = jsPath;
  }

  public getNodeId(): Promise<IExecJsPathResult<number>> {
    return this.runJsPath(`getNodeId`, this.jsPath);
  }

  public async exec<T>(): Promise<IExecJsPathResult<T>> {
    const result = await this.runJsPath<T>(`exec`, this.jsPath);

    if (result.isValueSerialized === true) {
      delete result.isValueSerialized;
      result.value = TypeSerializer.revive(result.value, 'BROWSER');
    }
    return result;
  }

  public waitForElement(
    waitForVisible: boolean,
    timeoutMillis: number,
  ): Promise<IExecJsPathResult<INodeVisibility>> {
    return this.runJsPath<INodeVisibility>(
      `waitForElement`,
      this.jsPath,
      waitForVisible,
      timeoutMillis,
    );
  }

  public getComputedVisibility(): Promise<IExecJsPathResult<INodeVisibility>> {
    return this.runJsPath(`getComputedVisibility`, this.jsPath);
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

  public getClientRect(includeNodeVisibility = false): Promise<IExecJsPathResult<IElementRect>> {
    return this.runJsPath(`getClientRect`, this.jsPath, includeNodeVisibility);
  }

  public simulateOptionClick(): Promise<IExecJsPathResult<boolean>> {
    return this.runJsPath(`simulateOptionClick`, this.jsPath);
  }

  public getWindowOffset(): Promise<IWindowOffset> {
    return this.frameEnvironment.runIsolatedFn(`${InjectedScripts.JsPath}.getWindowOffset`);
  }

  private async runJsPath<T>(
    fnName: string,
    ...args: Serializable[]
  ): Promise<IExecJsPathResult<T>> {
    const result = await this.frameEnvironment.runIsolatedFn<IExecJsPathResult<T>>(
      `${InjectedScripts.JsPath}.${fnName}`,
      ...args,
    );
    if (result.pathError) {
      throw new InjectedScriptError(result.pathError.error, result.pathError.pathState);
    }
    return result;
  }
}
