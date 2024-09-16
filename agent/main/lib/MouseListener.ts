import IMouseResult from '@ulixee/unblocked-specification/agent/interact/IMouseResult';
import { INodeVisibility } from '@ulixee/js-path';
import IWindowOffset from '@ulixee/unblocked-specification/agent/browser/IWindowOffset';
import Frame from './Frame';
import InjectedScripts from './InjectedScripts';

export default class MouseListener {
  private readonly frame: Frame;
  private readonly nodeId: number;

  constructor(frame: Frame, nodeId: number) {
    this.frame = frame;
    this.nodeId = nodeId;
  }

  public async register(): Promise<INodeVisibility> {
    const containerOffset = await this.frame.getContainerOffset();
    return this.frame.evaluate(
      `${InjectedScripts.MouseEvents}.listenFor(${this.nodeId}, ${JSON.stringify(
        containerOffset,
      )})`,
      {
        isolateFromWebPageEnvironment: this.frame.page.installJsPathIntoIsolatedContext,
      },
    );
  }

  public async didTriggerMouseEvent(): Promise<IMouseResult> {
    return await this.frame.evaluate<IMouseResult>(
      `${InjectedScripts.MouseEvents}.didTrigger(${this.nodeId})`,
      {
        isolateFromWebPageEnvironment: this.frame.page.installJsPathIntoIsolatedContext,
      },
    );
  }

  public static async waitForScrollStop(
    frame: Frame,
    timeoutMs?: number,
  ): Promise<[scrollX: number, scrollY: number]> {
    return await frame.evaluate(
      `${InjectedScripts.MouseEvents}.waitForScrollStop(${timeoutMs ?? 2e3})`,
      {
        isolateFromWebPageEnvironment: frame.page.installJsPathIntoIsolatedContext,
      },
    );
  }

  public static async getWindowOffset(frame: Frame): Promise<IWindowOffset> {
    return await frame.evaluate(`${InjectedScripts.MouseEvents}.getWindowOffset()`, {
      isolateFromWebPageEnvironment: frame.page.installJsPathIntoIsolatedContext,
    });
  }
}
