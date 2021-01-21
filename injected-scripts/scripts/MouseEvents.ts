// eslint-disable-next-line max-classes-per-file
import IMouseUpResult from '../interfaces/IMouseUpResult';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MouseEvents {
  private static pendingMouseover?: EventResolvable<MouseEvent, boolean>;
  private static pendingMouseup?: EventResolvable<MouseEvent, IMouseUpResult>;

  public static listenFor(mouseEvent: 'mouseup' | 'mouseover', nodeId: number) {
    const node = NodeTracker.getNodeWithId(nodeId);
    if (!node) throw new Error('Node not found');

    if (mouseEvent === 'mouseover') {
      this.clearPendingMouseover();
      this.pendingMouseover = new EventResolvable(nodeId, () => {
        if (this.pendingMouseover?.nodeId !== nodeId) return;
        this.pendingMouseover.resolve(true);
      });

      node.addEventListener('mouseover', this.pendingMouseover.onEventFn, {
        capture: false,
        once: true,
        passive: true,
      });
    } else {
      this.clearPendingMouseup();
      this.pendingMouseup = new EventResolvable(nodeId, (event: MouseEvent) => {
        if (this.pendingMouseup?.nodeId !== nodeId) return;

        const targetNodeId = event.target ? NodeTracker.getNodeId(event.target as Node) : undefined;
        const relatedTargetNodeId = event.relatedTarget
          ? NodeTracker.getNodeId(event.relatedTarget as Node)
          : undefined;

        this.pendingMouseup.resolve({
          pageX: event.pageX - window.pageXOffset,
          pageY: event.pageY - window.pageYOffset,
          targetNodeId,
          relatedTargetNodeId,
          didClickLocation: node.contains(event.target as Node) || node === event.target,
        });
      });

      window.addEventListener('mouseup', this.pendingMouseup.onEventFn, {
        capture: false,
        once: true,
        passive: true,
      });
    }
  }

  public static async waitFor(
    mouseEvent: 'mouseup' | 'mouseover',
    nodeId: number,
    timeoutMillis: number,
  ) {
    try {
      const pendingEvent = mouseEvent === 'mouseup' ? this.pendingMouseup : this.pendingMouseover;
      if (pendingEvent?.nodeId !== nodeId) {
        throw new Error(`${mouseEvent.toUpperCase()} listener not found`);
      }

      const result = await new Promise(async resolve => {
        let isResolved = false;
        const timeout = setTimeout(() => {
          isResolved = true;
          resolve('timeout');
        }, timeoutMillis) as any;

        const resolved = await pendingEvent.promise;
        clearTimeout(timeout);
        if (!isResolved) {
          resolve(resolved);
        }
      });

      if (mouseEvent === 'mouseup') {
        this.clearPendingMouseup();
      } else {
        this.clearPendingMouseover();
      }

      return TSON.stringify(result);
    } catch (error) {
      return TSON.stringify({
        error: String(error),
      });
    }
  }

  private static clearPendingMouseover() {
    if (this.pendingMouseover) {
      const node = NodeTracker.getNodeWithId(this.pendingMouseover.nodeId);
      node.removeEventListener('mouseover', this.pendingMouseover.onEventFn);
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
  promise: Promise<T>;
  resolve: (result: T) => void;
  constructor(readonly nodeId, readonly onEventFn: (ev: EventType) => void) {
    this.promise = new Promise<T>(resolve => {
      this.resolve = resolve;
    });
  }
}
