export default interface NodeTracker {
  has(node: Node): boolean;
  getNodeId(node: Node): number;
  watchNode(node: Node): number;
  track(node: Node): number;
  getWatchedNodeWithId(id: number, throwIfNotFound?: boolean): Node | undefined;
  restore(id: number, node: Node): void;
}
