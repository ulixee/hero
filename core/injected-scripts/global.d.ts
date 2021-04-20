interface ITson {
  stringify(object: any): string;
  parse(object: string): any;
}

interface IStaticNodeTracker {
  getNodeWithId(id: number): Node;
  has(node: Node): boolean;
  getNodeId(node: Node): number | undefined;
  assignNodeId(node: Node): number | undefined;
  track(node: Node): number;
}

declare let TSON: ITson;
declare let NodeTracker: IStaticNodeTracker;
