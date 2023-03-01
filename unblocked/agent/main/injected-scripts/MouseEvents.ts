import IMouseResult from '@ulixee/unblocked-specification/agent/interact/IMouseResult';
import { INodeVisibility } from '@ulixee/js-path';
import IWindowOffset from '@ulixee/unblocked-specification/agent/browser/IWindowOffset';

class MouseEvents {
  private static pendingEvent?: Promise<IMouseResult>;
  private static pendingEventResolve?: (result: IMouseResult) => void;
  private static targetNodeId: number;
  private static containerOffset: { x: number; y: number } = { x: 0, y: 0 };

  public static init() {
    this.onMousedown = this.onMousedown.bind(this);
  }

  public static getWindowOffset(): IWindowOffset {
    const scrollElement = document.scrollingElement ?? document.documentElement;
    return {
      innerHeight, // eslint-disable-line no-restricted-globals
      innerWidth, // eslint-disable-line no-restricted-globals
      scrollY: scrollElement?.scrollTop ?? 0,
      scrollX: scrollElement?.scrollLeft ?? 0,
      scrollHeight: scrollElement?.scrollHeight ?? 0,
      scrollWidth: scrollElement?.scrollWidth ?? 0,
    };
  }

  public static async waitForScrollStop(timeoutMillis: number) {
    const endTime = new Date().getTime() + (timeoutMillis ?? 50);
    const scrollElement = document.scrollingElement ?? document.documentElement;
    let left = 0;
    let top = 0;
    let consecutiveMatches = 0;
    do {
      await new Promise(requestAnimationFrame);
      const prevLeft = left;
      const prevTop = top;
      left = scrollElement.scrollLeft;
      top = scrollElement.scrollTop;
      if (left === prevLeft && top === prevTop) {
        consecutiveMatches += 1;
      } else {
        consecutiveMatches = 0;
      }
      if (consecutiveMatches >= 2) return [left, top];
    } while (new Date().getTime() < endTime);

    return [left, top];
  }

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
    this.pendingEvent = new Promise<IMouseResult>(resolve => {
      this.pendingEventResolve = resolve;
    });

    window.addEventListener('mousedown', this.onMousedown, {
      once: true,
      capture: true,
      passive: false,
    });

    return visibility;
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

  private static onMousedown(event: MouseEvent) {
    const desiredClickTarget = NodeTracker.getWatchedNodeWithId(this.targetNodeId) as Element;
    const targetNodeId = event.target ? NodeTracker.watchNode(event.target as Node) : undefined;
    const relatedTargetNodeId = event.relatedTarget
      ? NodeTracker.watchNode(event.relatedTarget as Node)
      : undefined;

    let hitElement = event.target as Node;
    let didClickLocation =
      desiredClickTarget.contains(hitElement) || desiredClickTarget === hitElement;
    if (!didClickLocation) {
      // try working around Chrome issues with shadow elements
      hitElement = ObjectAtPath.elementFromPoint(event.clientX, event.clientY);
      if (desiredClickTarget.contains(hitElement) || desiredClickTarget === hitElement) {
        didClickLocation = true;
      }
    }

    const result: IMouseResult = {
      pageX: this.containerOffset.x + event.pageX - window.scrollX,
      pageY: this.containerOffset.y + event.pageY - window.scrollY,
      targetNodeId,
      relatedTargetNodeId,
      didClickLocation,
    };

    if (!result.didClickLocation) {
      event.cancelBubble = true;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // @ts-ignore
      result.targetNodePreview = generateNodePreview(hitElement);
      // @ts-ignore
      result.expectedNodePreview = generateNodePreview(desiredClickTarget);
      result.expectedNodeVisibility = this.getNodeVisibility(desiredClickTarget);
    }

    this.pendingEventResolve(result);
    return result.didClickLocation;
  }

  private static getNodeVisibility(node: Node): INodeVisibility {
    const objectAtPath = new ObjectAtPath();
    objectAtPath.objectAtPath = node;
    return objectAtPath.getComputedVisibility();
  }

  private static clearEvent(nodeId: number) {
    if (this.targetNodeId === nodeId) {
      window.removeEventListener('mousedown', this.onMousedown);
      this.pendingEvent = null;
      this.pendingEventResolve = null;
      this.targetNodeId = null;
    }
  }
}

MouseEvents.init();
