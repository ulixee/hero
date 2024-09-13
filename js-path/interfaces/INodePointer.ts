export default interface INodePointer {
  id: number;
  type: string;
  preview?: string;
  iterableIsNodePointers?: boolean;
  iterableItems?: (string | number | boolean | object | INodePointer)[];
}
