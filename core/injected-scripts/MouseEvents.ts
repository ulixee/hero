// eslint-disable-next-line max-classes-per-file
import IMouseUpResult from '@secret-agent/core-interfaces/IMouseUpResult';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MouseEvents {
  private static pendingMouseover?: EventResolvable<MouseEvent, boolean>;
  private static pendingMouseup?: EventResolvable<MouseEvent, IMouseUpResult>;

  public static listenFor(mouseEvent: 'mouseup' | 'mouseover', nodeId: number) {
    this.clearEvent(mouseEvent);

    const node = NodeTracker.getNodeWithId(nodeId);
    if (!node) throw new Error('Node not found');

    if (mouseEvent === 'mouseover') {
      this.pendingMouseover = new EventResolvable(nodeId, () => {
        this.pendingMouseover?.resolve(true);
      });

      node.addEventListener('mouseover', this.pendingMouseover.onEventFn, {
        once: true,
      });
    } else {
      this.pendingMouseup = new EventResolvable(nodeId, event => {
        const targetNodeId = event.target
          ? NodeTracker.assignNodeId(event.target as Node)
          : undefined;
        const relatedTargetNodeId = event.relatedTarget
          ? NodeTracker.assignNodeId(event.relatedTarget as Node)
          : undefined;

        this.pendingMouseup?.resolve({
          pageX: event.pageX - window.pageXOffset,
          pageY: event.pageY - window.pageYOffset,
          targetNodeId,
          relatedTargetNodeId,
          didClickLocation: node.contains(event.target as Node) || node === event.target,
        });
      });

      window.addEventListener('mouseup', this.pendingMouseup.onEventFn, {
        once: true,
      });
    }
  }

  public static didTrigger(mouseEvent: 'mouseup' | 'mouseover', nodeId: number) {
    try {
      const pendingEvent = mouseEvent === 'mouseup' ? this.pendingMouseup : this.pendingMouseover;
      if (pendingEvent?.nodeId !== nodeId) {
        throw new Error(`${mouseEvent.toUpperCase()} listener not found`);
      }

      return TSON.stringify(pendingEvent.trigger);
    } catch (error) {
      return TSON.stringify({
        error: String(error),
      });
    } finally {
      this.clearEvent(mouseEvent);
    }
  }

  private static clearEvent(mouseEvent: 'mouseup' | 'mouseover') {
    if (mouseEvent === 'mouseover') this.clearPendingMouseover();
    if (mouseEvent === 'mouseup') this.clearPendingMouseup();
  }

  private static clearPendingMouseover() {
    if (this.pendingMouseover) {
      const node = NodeTracker.getNodeWithId(this.pendingMouseover.nodeId);
      node?.removeEventListener('mouseover', this.pendingMouseover.onEventFn);
      this.pendingMouseover = null;
    }
  }

  private static clearPendingMouseup() {
    if (this.pendingMouseup) {
      window.removeEventListener('mouseup', this.pendingMouseup.onEventFn);
      this.pendingMouseup = null;
    }
  }
}

class EventResolvable<EventType, T> {
  trigger: T;

  constructor(readonly nodeId, readonly onEventFn: (ev: EventType) => void) {}

  resolve(result: T) {
    this.trigger = result;
  }
}
