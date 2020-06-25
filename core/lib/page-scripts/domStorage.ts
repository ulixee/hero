import { IDomStorageForOrigin, IStorageEntry } from './interfaces/IDomStorage';
import { IIndexedDB } from './interfaces/IIndexedDB';

declare type TSON = any;

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
        openDBRequest.onsuccess = async event => {
          resolve((event.target as IDBRequest).result as IDBDatabase);
        };
      });
      const objectStoreNames = Array.from(idbDatabase.objectStoreNames);

      const transaction = idbDatabase.transaction(objectStoreNames, 'readonly');
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

        const allQuery = store.getAll();
        db.data[objectStoreName] = await new Promise(queryResolve => {
          allQuery.onsuccess = resultEvent => {
            const results = (resultEvent.target as IDBRequest<any[]>).result;
            // @ts-ignore
            queryResolve(results.map(x => TSON.stringify(x)));
          };
          allQuery.onerror = errorEvent => {
            console.log(`WARN: error extracting data! ${errorEvent}`);
            queryResolve([]);
          };
        });
      }

      return Promise.race([db, rejectPromise]);
    }),
  );
}

async function restoreIndexedDb(restoreDBs: IIndexedDB[]) {
  if (!restoreDBs || !restoreDBs.length) return;

  for (const restoreDB of restoreDBs) {
    await new Promise((resolve, reject) => {
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
      // @ts-ignore
      insertStore.add(TSON.parse(record));
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
