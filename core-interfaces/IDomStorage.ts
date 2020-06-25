import IDomStorage, {
  IDomStorageForOrigin,
  IStorageEntry,
} from '@secret-agent/core/lib/page-scripts/interfaces/IDomStorage';
import {
  IIndexedDB,
  IObjectStore,
  IObjectStoreIndex,
} from '@secret-agent/core/lib/page-scripts/interfaces/IIndexedDB';

export default IDomStorage;

export { IIndexedDB, IObjectStore, IObjectStoreIndex, IDomStorageForOrigin, IStorageEntry };
