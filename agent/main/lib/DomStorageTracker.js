"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
class DomStorageTracker extends eventUtils_1.TypedEventEmitter {
    constructor(page, storageByOrigin, networkManager, logger, isEnabled, session) {
        super();
        this.isEnabled = false;
        this.events = new EventSubscriber_1.default();
        this.processingPromise = Promise.resolve();
        this.indexedDBListUpdatingOrigins = new Set();
        this.indexedDBContentUpdatingOrigins = new Set();
        this.trackedOrigins = new Set();
        this.isEnabled = isEnabled;
        this.page = page;
        session ??= page.devtoolsSession;
        this.devtoolsSession = session;
        this.networkManager = networkManager;
        this.storageByOrigin = storageByOrigin ?? {};
        this.logger = logger.createChild(module);
        this.onDomStorageAdded = this.onDomStorageAdded.bind(this);
        if (session.listeners('DOMStorage.domStorageItemAdded').includes(this.onDomStorageAdded)) {
            return;
        }
        this.events.on(session, 'DOMStorage.domStorageItemAdded', this.onDomStorageAdded);
        this.events.on(session, 'DOMStorage.domStorageItemRemoved', this.onDomStorageRemoved.bind(this));
        this.events.on(session, 'DOMStorage.domStorageItemUpdated', this.onDomStorageUpdated.bind(this));
        this.events.on(session, 'DOMStorage.domStorageItemsCleared', this.onDomStorageCleared.bind(this));
        this.events.on(session, 'Storage.indexedDBListUpdated', this.onIndexedDBListUpdated.bind(this));
        this.events.on(session, 'Storage.indexedDBContentUpdated', this.onIndexedDBContentUpdated.bind(this));
    }
    close() {
        this.events.close();
        this.cancelPendingEvents('DomStorageTracker closed');
    }
    reset() {
        for (const key of Object.keys(this.storageByOrigin))
            delete this.storageByOrigin[key];
        this.indexedDBContentUpdatingOrigins.clear();
        this.indexedDBListUpdatingOrigins.clear();
        this.processingPromise = Promise.resolve();
        this.trackedOrigins.clear();
    }
    async finalFlush(timeoutMs = 30e3) {
        this.events.close();
        await Promise.race([
            this.processingPromise,
            new Promise(resolve => setTimeout(resolve, timeoutMs ?? 0)),
        ]);
    }
    initialize() {
        if (!this.isEnabled)
            return Promise.resolve();
        return Promise.all([
            this.devtoolsSession.send('DOMStorage.enable'),
            this.devtoolsSession.send('IndexedDB.enable'),
        ]).catch(err => err);
    }
    isTracking(securityOrigin) {
        return this.trackedOrigins.has(securityOrigin);
    }
    track(securityOrigin) {
        if (!this.isEnabled)
            return;
        if (!securityOrigin || securityOrigin === 'null' || this.trackedOrigins.has(securityOrigin))
            return;
        // just initialized if needed
        this.trackedOrigins.add(securityOrigin);
        this.storageForOrigin(securityOrigin);
        this.devtoolsSession
            .send('Storage.trackIndexedDBForOrigin', {
            origin: securityOrigin,
        })
            .catch(error => {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            this.logger.info('Failed to watch Frame origin for storage changes', {
                securityOrigin,
                error,
            });
        });
    }
    async getStorageByOrigin() {
        const result = [];
        for (const origin of this.trackedOrigins) {
            const record = {
                frame: null,
                origin,
                databaseNames: [],
                storageForOrigin: this.storageByOrigin[origin] ??
                    {
                        localStorage: [],
                        sessionStorage: [],
                        indexedDB: [],
                    },
            };
            record.databaseNames = record.storageForOrigin.indexedDB.map(x => x.name);
            result.push(record);
            try {
                record.frame = this.page.frames.find(x => x.securityOrigin === origin && x.isAttached);
                if (record.frame && !record.databaseNames.length) {
                    const { databaseNames } = await this.devtoolsSession.send('IndexedDB.requestDatabaseNames', {
                        securityOrigin: origin,
                    });
                    record.databaseNames = databaseNames;
                }
            }
            catch (err) {
                // can throw if document not found in page
                record.frame = null;
            }
        }
        return result;
    }
    storageForOrigin(securityOrigin) {
        this.storageByOrigin[securityOrigin] ??= {
            indexedDB: [],
            localStorage: [],
            sessionStorage: [],
        };
        return this.storageByOrigin[securityOrigin];
    }
    onDomStorageAdded(event) {
        const timestamp = Date.now();
        const { isLocalStorage, securityOrigin } = event.storageId;
        const originStorage = this.storageForOrigin(securityOrigin);
        if (isLocalStorage) {
            originStorage.localStorage.push([event.key, event.newValue]);
        }
        else {
            originStorage.sessionStorage.push([event.key, event.newValue]);
        }
        this.emit('dom-storage-updated', {
            action: 'add',
            type: isLocalStorage ? 'localStorage' : 'sessionStorage',
            securityOrigin,
            key: event.key,
            value: event.newValue,
            timestamp,
        });
    }
    onDomStorageRemoved(event) {
        const timestamp = Date.now();
        const { isLocalStorage, securityOrigin } = event.storageId;
        const originStorage = this.storageForOrigin(securityOrigin);
        const list = isLocalStorage ? originStorage.localStorage : originStorage.sessionStorage;
        const index = list.findIndex(x => x[0] === event.key);
        if (index >= 0)
            list.splice(index, 1);
        this.emit('dom-storage-updated', {
            action: 'remove',
            type: isLocalStorage ? 'localStorage' : 'sessionStorage',
            securityOrigin,
            key: event.key,
            timestamp,
        });
    }
    onDomStorageUpdated(event) {
        const timestamp = Date.now();
        const { isLocalStorage, securityOrigin } = event.storageId;
        const originStorage = this.storageForOrigin(securityOrigin);
        const list = isLocalStorage ? originStorage.localStorage : originStorage.sessionStorage;
        const index = list.findIndex(x => x[0] === event.key);
        if (index >= 0)
            list[index][1] = event.newValue;
        this.emit('dom-storage-updated', {
            action: 'update',
            type: isLocalStorage ? 'localStorage' : 'sessionStorage',
            securityOrigin,
            key: event.key,
            value: event.newValue,
            timestamp,
        });
    }
    onDomStorageCleared(event) {
        const timestamp = Date.now();
        const { isLocalStorage, securityOrigin } = event.storageId;
        const originStorage = this.storageForOrigin(securityOrigin);
        const list = isLocalStorage ? originStorage.localStorage : originStorage.sessionStorage;
        if (!list?.length)
            return;
        for (const entry of list) {
            if (!entry || !entry[0]) {
                console.warn('Invalid DomStorage entry', { entry, list });
                continue;
            }
            const key = entry[0];
            this.emit('dom-storage-updated', {
                action: 'remove',
                type: isLocalStorage ? 'localStorage' : 'sessionStorage',
                securityOrigin,
                key,
                timestamp,
            });
        }
    }
    async onIndexedDBListUpdated(event) {
        const timestamp = Date.now();
        const securityOrigin = event.origin;
        if (this.indexedDBListUpdatingOrigins.has(securityOrigin))
            return;
        this.indexedDBListUpdatingOrigins.add(securityOrigin);
        const resolvable = new Resolvable_1.default();
        this.processingPromise = this.processingPromise.then(() => resolvable.promise);
        try {
            const dbs = await this.devtoolsSession.send('IndexedDB.requestDatabaseNames', {
                securityOrigin,
            });
            const originStorage = this.storageForOrigin(event.origin);
            const startNames = new Set(originStorage.indexedDB.map(x => x.name));
            for (const name of dbs.databaseNames) {
                const existing = startNames.has(name);
                if (existing)
                    continue;
                const db = await this.getLatestIndexedDB(securityOrigin, name);
                if (!originStorage.indexedDB.some(x => x.name === name))
                    originStorage.indexedDB.push(db);
                this.emit('dom-storage-updated', {
                    action: 'add',
                    type: 'indexedDB',
                    key: name,
                    value: null,
                    meta: db,
                    securityOrigin,
                    timestamp,
                });
            }
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            if (error.code === -32000)
                return;
            this.logger.info('DomStorageTracker.onIndexedDBListUpdated:ERROR', {
                error,
                event,
            });
        }
        finally {
            this.indexedDBListUpdatingOrigins.delete(securityOrigin);
            resolvable.resolve();
        }
    }
    async onIndexedDBContentUpdated(event) {
        const { origin: securityOrigin, databaseName, objectStoreName } = event;
        if (this.indexedDBContentUpdatingOrigins.has(securityOrigin))
            return;
        this.indexedDBContentUpdatingOrigins.add(securityOrigin);
        const timestamp = Date.now();
        const resolvable = new Resolvable_1.default();
        this.processingPromise = this.processingPromise.then(() => resolvable.promise);
        try {
            const db = await this.getLatestIndexedDB(securityOrigin, databaseName);
            const objectStore = db.objectStores.find(x => x.name === objectStoreName);
            const metadata = await this.devtoolsSession.send('IndexedDB.getMetadata', {
                securityOrigin,
                databaseName,
                objectStoreName,
            });
            const originStorage = this.storageForOrigin(securityOrigin);
            const dbIndex = originStorage.indexedDB.findIndex(x => x.name === databaseName);
            if (dbIndex === -1) {
                originStorage.indexedDB.push(db);
            }
            else {
                originStorage.indexedDB[dbIndex].objectStores = db.objectStores;
            }
            this.emit('dom-storage-updated', {
                action: 'update',
                type: 'indexedDB',
                value: null,
                meta: { metadata, objectStore },
                key: `${databaseName}.${objectStoreName}`,
                securityOrigin,
                timestamp,
            });
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            if (error.code === -32000)
                return;
            this.logger.info('DomStorageTracker.onIndexedDBContentUpdated', {
                error,
                event,
            });
        }
        finally {
            this.indexedDBContentUpdatingOrigins.delete(securityOrigin);
            resolvable.resolve();
        }
    }
    async getLatestIndexedDB(securityOrigin, databaseName) {
        const { databaseWithObjectStores } = await this.devtoolsSession.send('IndexedDB.requestDatabase', {
            databaseName,
            securityOrigin,
        });
        return {
            ...databaseWithObjectStores,
            objectStores: databaseWithObjectStores.objectStores?.map(x => ({
                ...x,
                keyPath: flatKeypath(x.keyPath),
                indexes: x.indexes.map(y => ({
                    ...y,
                    keyPath: flatKeypath(y.keyPath),
                })),
            })),
            data: null,
        };
    }
}
exports.default = DomStorageTracker;
function flatKeypath(keypath) {
    if (keypath.type === 'null')
        return null;
    if (keypath.type === 'string')
        return keypath.string;
    return keypath.array;
}
//# sourceMappingURL=DomStorageTracker.js.map