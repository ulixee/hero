import FrameEnvironment from './FrameEnvironment';

export default class MouseoverListener {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly nodeId: number;

  constructor(frameEnvironment: FrameEnvironment, nodeId: number) {
    this.frameEnvironment = frameEnvironment;
    this.nodeId = nodeId;
  }

  public register(): Promise<void> {
    return this.frameEnvironment.runIsolatedFn(
      'window.SecretAgent.MouseEvents.listenFor',
      'mouseover',
      this.nodeId,
    );
  }

  public async waitForMouseEvent(timeoutMillis: number): Promise<boolean> {
    const result = await this.frameEnvironment.runIsolatedFn<boolean>(
      'window.SecretAgent.MouseEvents.waitFor',
      'mouseover',
      this.nodeId,
      timeoutMillis,
    );
    if ((result as any) === 'timeout') {
      return false;
    }
    return result;
  }
}
