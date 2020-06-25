// COPIED FROM NODERDOM!!

export default interface IAttachedState {
  id: number;
  // the type of remote node
  type: string;
  // if custom type, will return "ids", otherwise, will serialize items
  iterableIsCustomType: boolean;
  iterableIds?: number[];
  iterableItems?: any[];
  properties?: {
    [key: string]: any;
  };
}
