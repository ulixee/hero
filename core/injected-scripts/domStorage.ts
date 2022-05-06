import type { IDomStorageForOrigin } from '@bureau/interfaces/IDomStorage';
import type { IIndexedDB } from '@bureau/interfaces/IIndexedDB';

function dumpStorage(storage: Storage) {
  const store: [string, string][] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    store.push([key, storage.getItem(key)]);
  }
  return store;
}

async function exportIndexedDbs(dbNames: string[]) {
  if (!dbNames || !dbNames.length) return [];

  return await Promise.all(
    dbNames.map(async name => {
      const openDBRequest = window.indexedDB.open(name);

      const idbDatabase = await new Promise<IDBDatabase>(resolve => {
        openDBRequest.onsuccess = event => {
          resolve((event.target as IDBRequest).result as IDBDatabase);
        };
      });
      const objectStoreNames = Array.from(idbDatabase.objectStoreNames);
      if (!objectStoreNames.length) return;

      const transaction = idbDatabase.transaction(objectStoreNames, 'readonly');
      // eslint-disable-next-line promise/param-names
      const rejectPromise = new Promise<IIndexedDB>((_, reject) => (transaction.onerror = reject));

      const db: IIndexedDB = {
        name,
        version: idbDatabase.version,
        objectStores: [],
        data: {},
      };

      for (const objectStoreName of objectStoreNames) {
        const store = transaction.objectStore(objectStoreName);
        db.objectStores.push({
          name: objectStoreName,
          indexes: Array.from(store.indexNames).map(idxName => {
            const index = store.index(idxName);
            return {
              name: index.name,
              keyPath: index.keyPath,
              unique: index.unique,
              multiEntry: index.multiEntry,
            };
          }),
          keyPath: store.keyPath,
          autoIncrement: store.autoIncrement,
        });

        db.data[objectStoreName] = await readStoreData(store);
      }
      return Promise.race([db, rejectPromise]);
    }),
  );
}

async function readStoreData(store: IDBObjectStore) {
  const data: string[] = [];
  await new Promise<void>(resolve => {
    const cursorQuery = store.openCursor();
    cursorQuery.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const key = store.keyPath === null ? cursor.key : undefined;
        const value = cursor.value;
        data.push(TypeSerializer.stringify({ key, value }));
        cursor.continue();
      } else {
        resolve();
      }
    };
    cursorQuery.onerror = () => resolve();
  });
  return data;
}

// @ts-ignore
window.exportDomStorage = async (dbNames: string[]) => {
  return {
    localStorage: dumpStorage(localStorage),
    sessionStorage: dumpStorage(sessionStorage),
    indexedDB: await exportIndexedDbs(dbNames),
  } as IDomStorageForOrigin;
};
