export interface IIndexedDB {
  name: string;
  version: number;
  objectStores: IObjectStore[];
  data: { [storeName: string]: IJsonString[] };
}

type IJsonString = string;

export interface IObjectStore {
  name: string;
  keyPath: string | string[];
  autoIncrement: boolean;
  indexes: IObjectStoreIndex[];
}

export interface IObjectStoreIndex {
  name: string;
  keyPath: string | string[];
  unique: boolean;
  multiEntry: boolean;
}
