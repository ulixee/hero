import IMouseResult from '@ulixee/hero-interfaces/IMouseResult';
import FrameEnvironment from './FrameEnvironment';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';

export default class MouseListener {
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

  public async didTriggerMouseEvent(): Promise<IMouseResult> {
    return await this.frameEnvironment.runIsolatedFn<IMouseResult>(
      'HERO.MouseEvents.didTrigger',
      this.nodeId,
    );
  }
}
