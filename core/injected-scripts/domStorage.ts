import { IDomStorageForOrigin, IStorageEntry } from '@ulixee/hero-interfaces/IDomStorage';
import { IIndexedDB } from '@ulixee/hero-interfaces/IIndexedDB';

function dumpStorage(storage: Storage) {
  const store: [string, string][] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    store.push([key, storage.getItem(key)]);
  }
  return store;
}

function restoreStorage(storage: Storage, store: IStorageEntry[]) {
  // only run on empty!
  if (storage.length) return;
  if (!store || !store.length) return;
  for (const [key, value] of store) {
    storage.setItem(key, value);
  }
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

async function restoreIndexedDb(restoreDBs: IIndexedDB[]) {
  if (!restoreDBs || !restoreDBs.length) return;

  for (const restoreDB of restoreDBs) {
    await new Promise<void>((resolve, reject) => {
      const openDBRequest = indexedDB.open(restoreDB.name, restoreDB.version);
      // only run changes when the db doesn't already exist
      openDBRequest.onupgradeneeded = event => {
        const request = event.target as IDBRequest<IDBDatabase>;
        const db = request.result;
        for (const objectStoreToRestore of restoreDB.objectStores) {
          const objectStore = db.createObjectStore(objectStoreToRestore.name, {
            autoIncrement: objectStoreToRestore.autoIncrement,
            keyPath: objectStoreToRestore.keyPath,
          });

          for (const restoreIndex of objectStoreToRestore.indexes) {
            objectStore.createIndex(restoreIndex.name, restoreIndex.keyPath, {
              multiEntry: restoreIndex.multiEntry,
              unique: restoreIndex.unique,
            });
          }
        }
      };
      openDBRequest.onsuccess = async event => {
        const request = event.target as IDBRequest<IDBDatabase>;
        try {
          await restoreData(request.result, restoreDB);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      openDBRequest.onerror = reject;
    });
  }
}

async function restoreData(db: IDBDatabase, restoreDB: IIndexedDB) {
  for (const objectStoreToRestore of restoreDB.objectStores) {
    const data = restoreDB.data[objectStoreToRestore.name];
    if (!data || !data.length) continue;
    const insertStore = db
      .transaction(objectStoreToRestore.name, 'readwrite')
      .objectStore(objectStoreToRestore.name);
    for (const record of data) {
      const { key, value } = TypeSerializer.parse(record);
      insertStore.add(value, key);
    }
    await new Promise((resolve, reject) => {
      insertStore.transaction.oncomplete = resolve;
      insertStore.transaction.onerror = reject;
    });
  }
}

// @ts-ignore
window.restoreUserStorage = async (data: IDomStorageForOrigin) => {
  if (!data) return;
  restoreStorage(localStorage, data.localStorage);
  restoreStorage(sessionStorage, data.sessionStorage);
  await restoreIndexedDb(data.indexedDB);
};

// @ts-ignore
window.exportDomStorage = async (dbNames: string[]) => {
  return {
    localStorage: dumpStorage(localStorage),
    sessionStorage: dumpStorage(sessionStorage),
    indexedDB: await exportIndexedDbs(dbNames),
  } as IDomStorageForOrigin;
};
