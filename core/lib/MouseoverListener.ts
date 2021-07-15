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
      'HERO.MouseEvents.listenFor',
      'mouseover',
      this.nodeId,
    );
  }

  public async didTriggerMouseEvent(): Promise<boolean> {
    return await this.frameEnvironment.runIsolatedFn<boolean>(
      'HERO.MouseEvents.didTrigger',
      'mouseover',
      this.nodeId,
    );
  }
}
