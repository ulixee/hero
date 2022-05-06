interface ITypeSerializer {
  stringify(object: any): string;
  parse(object: string): any;
  replace(object: any): any;
}

interface IStaticNodeTracker {
  has(node: Node): boolean;
  getNodeId(node: Node): number | undefined;
  getWatchedNodeWithId(id: number): Node;
  watchNode(node: Node): number | undefined;
  track(node: Node): number;
}

declare let TypeSerializer: ITypeSerializer;
declare let NodeTracker: IStaticNodeTracker;
