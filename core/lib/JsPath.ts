import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IExecJsPathResult from '@secret-agent/core-interfaces/IExecJsPathResult';
import getAttachedStateFnName from '@secret-agent/core-interfaces/getAttachedStateFnName';
import IElementRect from '@secret-agent/core-interfaces/IElementRect';
import IWindowOffset from '@secret-agent/core-interfaces/IWindowOffset';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';

export class JsPath {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly jsPath: IJsPath;

  constructor(frameEnvironment: FrameEnvironment, jsPath: IJsPath) {
    this.frameEnvironment = frameEnvironment;
    this.jsPath = jsPath;
  }

  public getAttachedState<T>(): Promise<IExecJsPathResult<T>> {
    return this.frameEnvironment.runIsolatedFn<IExecJsPathResult<T>>(
      `${InjectedScripts.JsPath}.exec`,
      [...this.jsPath, [getAttachedStateFnName]],
    );
  }

  public exec<T>(propertiesToExtract?: string[]): Promise<IExecJsPathResult<T>> {
    return this.frameEnvironment.runIsolatedFn(
      `${InjectedScripts.JsPath}.exec`,
      this.jsPath,
      propertiesToExtract,
    );
  }

  public waitForElement(
    waitForVisible: boolean,
    timeoutMillis: number,
  ): Promise<IExecJsPathResult<boolean>> {
    return this.frameEnvironment.runIsolatedFn(
      `${InjectedScripts.JsPath}.waitForElement`,
      this.jsPath,
      waitForVisible,
      timeoutMillis,
    );
  }

  public isVisible(): Promise<IExecJsPathResult<boolean>> {
    return this.frameEnvironment.runIsolatedFn(`${InjectedScripts.JsPath}.isVisible`, this.jsPath);
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

  public getClientRect(): Promise<IElementRect> {
    return this.frameEnvironment.runIsolatedFn(
      `${InjectedScripts.JsPath}.getClientRect`,
      this.jsPath,
    );
  }

  public simulateOptionClick(): Promise<boolean> {
    return this.frameEnvironment.runIsolatedFn(
      `${InjectedScripts.JsPath}.simulateOptionClick`,
      this.jsPath,
    );
  }

  public getWindowOffset(): Promise<IWindowOffset> {
    return this.frameEnvironment.runIsolatedFn(`${InjectedScripts.JsPath}.getWindowOffset`);
  }
}
