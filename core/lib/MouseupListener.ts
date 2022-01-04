import IMouseUpResult from '@ulixee/hero-interfaces/IMouseUpResult';
import FrameEnvironment from './FrameEnvironment';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';

export default class MouseupListener {
  private readonly frameEnvironment: FrameEnvironment;
  private readonly nodeId: number;

  constructor(frameEnvironment: FrameEnvironment, nodeId: number) {
    this.frameEnvironment = frameEnvironment;
    this.nodeId = nodeId;
  }

  public async register(): Promise<INodeVisibility> {
    const containerOffset = await this.frameEnvironment.getContainerOffset();
    return this.frameEnvironment.runIsolatedFn(
      'HERO.MouseEvents.listenFor',
      this.nodeId,
      containerOffset,
    );
  }

  public async didTriggerMouseEvent(): Promise<IMouseUpResult> {
    return await this.frameEnvironment.runIsolatedFn<IMouseUpResult>(
      'HERO.MouseEvents.didTrigger',
      this.nodeId,
    );
  }
}
