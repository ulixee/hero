import IDomStorage, {
  IDomStorageForOrigin,
  IStorageEntry,
} from '@secret-agent/injected-scripts/interfaces/IDomStorage';
import {
  IIndexedDB,
  IObjectStore,
  IObjectStoreIndex,
} from '@secret-agent/injected-scripts/interfaces/IIndexedDB';

export default IDomStorage;

export { IIndexedDB, IObjectStore, IObjectStoreIndex, IDomStorageForOrigin, IStorageEntry };
