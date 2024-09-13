export default interface IDomPolyfill {
  add: IDomPolyfillAddItem[];
  remove: IDomPolyfillRemoveItem[];
  modify: IDomPolyfillModifyItem[];
  reorder: IDomPolyfillChangeOrder[];
}

export type IDomPolyfillRemove = IDomPolyfillRemoveItem[];

interface IDomPolyfillRemoveItem {
  path: string;
  propertyName: string;
}

interface IDomPolyfillAddItem {
  path: string;
  property: any;
  propertyName: string;
  prevProperty: string;
}

interface IDomPolyfillModifyItem {
  path: string;
  property: any;
  propertyName: string;
}

interface IDomPolyfillChangeOrder {
  path: string;
  propertyName: string;
  prevProperty: string;
  throughProperty: string;
}

