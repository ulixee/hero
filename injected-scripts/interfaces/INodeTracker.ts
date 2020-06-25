export default interface INodeTracker {
  has(node: Node): boolean;
  getId(node: Node): number | undefined;
  track(node: Node): number;
  getNode(id: number): Node | null;
}
