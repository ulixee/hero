import IMouseUpResult from '@secret-agent/core-interfaces/IMouseUpResult';
import FrameEnvironment from './FrameEnvironment';

export default class MouseupListener {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly nodeId: number;

  constructor(frameEnvironment: FrameEnvironment, nodeId: number) {
    this.frameEnvironment = frameEnvironment;
    this.nodeId = nodeId;
  }

  public register(): Promise<void> {
    return this.frameEnvironment.runIsolatedFn(
      'window.SecretAgent.MouseEvents.listenFor',
      'mouseup',
      this.nodeId,
    );
  }

  public async waitForMouseEvent(timeoutMillis: number): Promise<IMouseUpResult> {
    const result = await this.frameEnvironment.runIsolatedFn<IMouseUpResult>(
      'window.SecretAgent.MouseEvents.waitFor',
      'mouseup',
      this.nodeId,
      timeoutMillis,
    );

    if ((result as any) === 'timeout') {
      return {
        didClickLocation: false,
      } as IMouseUpResult;
    }
    return result;
  }
}
