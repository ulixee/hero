import IMouseUpResult from '@secret-agent/interfaces/IMouseUpResult';
import FrameEnvironment from './FrameEnvironment';

export default class MouseupListener {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly nodeId: number;

  constructor(frameEnvironment: FrameEnvironment, nodeId: number) {
    this.frameEnvironment = frameEnvironment;
    this.nodeId = nodeId;
  }

  public register(): Promise<void> {
    return this.frameEnvironment.runIsolatedFn('SA.MouseEvents.listenFor', 'mouseup', this.nodeId);
  }

  public async didTriggerMouseEvent(): Promise<IMouseUpResult> {
    return await this.frameEnvironment.runIsolatedFn<IMouseUpResult>(
      'SA.MouseEvents.didTrigger',
      'mouseup',
      this.nodeId,
    );
  }
}
