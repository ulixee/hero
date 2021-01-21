interface ITson {
  stringify(object: any): string;
  parse(object: string): any;
}

interface INodeTracker {
  getNodeWithId(id: number): Node;
  getNodeId(node: Node): number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let TSON: ITson;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let NodeTracker: INodeTracker;
