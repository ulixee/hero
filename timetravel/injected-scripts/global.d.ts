declare class NodeTracker {
  static has(node: Node): boolean;
  static getNodeId(node: Node): number;
  static watchNode(node: Node): number;
  static track(node: Node): number;
  static getWatchedNodeWithId(id: number, throwIfNotFound?: boolean): Node | undefined;
  static restore(id: number, node: Node): void;
}
