interface ITson {
  stringify(object: any): string;
  parse(object: string): any;
}

interface INodeTracker {
  has(node: Node): boolean;
  getId(node: Node): number | undefined;
  track(node: Node): number;
  getNode(id: number): Node | null;
}

interface IStaticNodeTracker {
  getNodeWithId(id: number): Node;
  getNodeId(node: Node): number;
}

declare let TSON: ITson;
declare let NodeTracker: IStaticNodeTracker;
