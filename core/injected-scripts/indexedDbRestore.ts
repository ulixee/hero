import type { IIndexedDB } from '@unblocked-web/emulator-spec/browser/IIndexedDB';

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
window.restoreUserStorage = restoreIndexedDb;
