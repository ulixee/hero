"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function dumpStorage(storage) {
    const store = [];
    for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        store.push([key, storage.getItem(key)]);
    }
    return store;
}
async function exportIndexedDbs(dbNames) {
    if (!dbNames || !dbNames.length)
        return [];
    return await Promise.all(dbNames.map(async (name) => {
        const openDBRequest = window.indexedDB.open(name);
        const idbDatabase = await new Promise(resolve => {
            openDBRequest.onsuccess = event => {
                resolve(event.target.result);
            };
        });
        const objectStoreNames = Array.from(idbDatabase.objectStoreNames);
        if (!objectStoreNames.length)
            return;
        const transaction = idbDatabase.transaction(objectStoreNames, 'readonly');
        // eslint-disable-next-line promise/param-names
        const rejectPromise = new Promise((_, reject) => (transaction.onerror = reject));
        const db = {
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
    }));
}
async function readStoreData(store) {
    const data = [];
    await new Promise(resolve => {
        const cursorQuery = store.openCursor();
        cursorQuery.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                const key = store.keyPath === null ? cursor.key : undefined;
                let value = cursor.value;
                if (typeof value === 'object' && !('toJSON' in value && typeof value.toJSON === 'function')) {
                    value = { ...value };
                }
                data.push(TypeSerializer.stringify({ key, value }));
                cursor.continue();
            }
            else {
                resolve();
            }
        };
        cursorQuery.onerror = () => resolve();
    });
    return data;
}
// @ts-ignore
window.exportDomStorage = async (dbNames) => {
    return {
        localStorage: dumpStorage(localStorage),
        sessionStorage: dumpStorage(sessionStorage),
        indexedDB: await exportIndexedDbs(dbNames),
    };
};
//# sourceMappingURL=domStorage.js.map