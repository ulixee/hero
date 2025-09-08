import { IIndexedDB, IObjectStore, IObjectStoreIndex } from './IIndexedDB';
export default interface IDomStorage {
    [securityOrigin: string]: IDomStorageForOrigin;
}
export interface IDomStorageForOrigin {
    localStorage: IStorageEntry[];
    sessionStorage: IStorageEntry[];
    indexedDB: IIndexedDB[];
}
export type IStorageEntry = string[];
export { IIndexedDB, IObjectStore, IObjectStoreIndex };
