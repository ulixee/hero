// have to add an import to use global define
import { } from '@ulixee/unblocked-specification/agent/browser/IWindowOffset';

interface IStaticNodeTracker {
  has(node: Node): boolean;
  getNodeId(node: Node): number | undefined;
  getWatchedNodeWithId(id: number): Node;
  watchNode(node: Node): number | undefined;
  track(node: Node): number;
}

declare global {
  interface Window {
    NodeTracker: IStaticNodeTracker;
  }
  let NodeTracker: IStaticNodeTracker;
}

function NodeTrackerStatics(staticClass: IStaticNodeTracker) {}

@NodeTrackerStatics
class NodeTracker {
  public static nodeIdSymbol = Symbol.for('heroNodeId');
  private static nextId = 1;
  private static watchedNodesById = new Map<number, Node>();

  public static has(node: Node): boolean {
    return !!node[this.nodeIdSymbol];
  }

  public static getNodeId(node: Node): number {
    if (!node) return undefined;
    return node[this.nodeIdSymbol] ?? undefined;
  }

  public static watchNode(node: Node): number {
    let id = this.getNodeId(node);
    if (!id) {
      // extract so we detect any nodes that haven't been extracted yet. Ie, called from jsPath
      if ('extractDomChanges' in window) {
        window.extractDomChanges();
      }
      if (!this.has(node) && 'trackElement' in window) {
        window.trackElement(node as any);
      }
      id = this.track(node);
    }

    this.watchedNodesById.set(id, node);
    return id;
  }

  public static track(node: Node): number {
    if (!node) return;
    if (node[this.nodeIdSymbol]) {
      return node[this.nodeIdSymbol];
    }
    const id = this.nextId;
    this.nextId += 1;
    node[this.nodeIdSymbol] = id;
    return id;
  }

  public static getWatchedNodeWithId(id: number, throwIfNotFound = true): Node | undefined {
    if (this.watchedNodesById.has(id)) {
      return this.watchedNodesById.get(id);
    }
    if (throwIfNotFound) throw new Error(`Node with id not found -> ${id}`);
  }

  public static restore(id: number, node: Node): void {
    node[this.nodeIdSymbol] = id;
    this.watchedNodesById.set(id, node);
    if (id > this.nextId) this.nextId = id + 1;
  }
}

window.NodeTracker = NodeTracker;
