import IMouseUpResult from '@ulixee/hero-interfaces/IMouseUpResult';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';

class MouseEvents {
  private static pendingEvent?: Promise<IMouseUpResult>;
  private static pendingEventResolve?: (result: IMouseUpResult) => void;
  private static targetNodeId: number;
  private static containerOffset: { x: number; y: number } = { x: 0, y: 0 };

  public static listenFor(
    nodeId: number,
    containerOffset: { x: number; y: number },
  ): INodeVisibility {
    if (this.targetNodeId) this.clearEvent(this.targetNodeId);

    const node = NodeTracker.getWatchedNodeWithId(nodeId);
    if (!node) throw new Error('Node not found');

    const visibility = this.getNodeVisibility(node);

    this.containerOffset = containerOffset;
    this.targetNodeId = nodeId;
    this.pendingEvent = new Promise<IMouseUpResult>(resolve => {
      this.pendingEventResolve = resolve;
    });

    window.addEventListener('mouseup', this.onMouseup, {
      once: true,
    });

    return visibility;
  }

  public static init() {
    this.onMouseup = this.onMouseup.bind(this);
  }

  public static didTrigger(nodeId: number) {
    try {
      if (this.targetNodeId !== nodeId) {
        throw new Error(`"mouseup" listener not found`);
      }

      return this.pendingEvent;
    } finally {
      this.clearEvent(nodeId);
    }
  }

  private static onMouseup(event: MouseEvent) {
    const node = NodeTracker.getWatchedNodeWithId(this.targetNodeId);
    const targetNodeId = event.target ? NodeTracker.watchNode(event.target as Node) : undefined;
    const relatedTargetNodeId = event.relatedTarget
      ? NodeTracker.watchNode(event.relatedTarget as Node)
      : undefined;

    const result: IMouseUpResult = {
      pageX: this.containerOffset.x + event.pageX - window.scrollX,
      pageY: this.containerOffset.y + event.pageY - window.scrollY,
      targetNodeId,
      relatedTargetNodeId,
      didClickLocation: node.contains(event.target as Node) || node === event.target,
    };

    if (!result.didClickLocation) {
      // @ts-ignore
      result.targetNodePreview = generateNodePreview(event.target);
      // @ts-ignore
      result.expectedNodePreview = generateNodePreview(node);
      result.expectedNodeVisibility = this.getNodeVisibility(node);
    }

    this.pendingEventResolve(result);
  }

  private static getNodeVisibility(node: Node): INodeVisibility {
    const objectAtPath = new ObjectAtPath();
    objectAtPath.objectAtPath = node;
    return objectAtPath.getComputedVisibility();
  }

  private static clearEvent(nodeId: number) {
    if (this.targetNodeId === nodeId) {
      window.removeEventListener('mouseup', this.onMouseup);
      this.pendingEvent = null;
      this.pendingEventResolve = null;
      this.targetNodeId = null;
    }
  }
}

MouseEvents.init();
