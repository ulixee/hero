import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IDomStorage, {
  IDomStorageForOrigin,
} from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import { IIndexedDB } from '@ulixee/unblocked-specification/agent/browser/IIndexedDB';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import Page from './Page';
import NetworkManager from './NetworkManager';
import DevtoolsSession from './DevtoolsSession';
import DomStorageItemAddedEvent = Protocol.DOMStorage.DomStorageItemAddedEvent;
import DomStorageItemRemovedEvent = Protocol.DOMStorage.DomStorageItemRemovedEvent;
import DomStorageItemUpdatedEvent = Protocol.DOMStorage.DomStorageItemUpdatedEvent;
import DomStorageItemsClearedEvent = Protocol.DOMStorage.DomStorageItemsClearedEvent;
import IndexedDBListUpdatedEvent = Protocol.Storage.IndexedDBListUpdatedEvent;
import IndexedDBContentUpdatedEvent = Protocol.Storage.IndexedDBContentUpdatedEvent;
import KeyPath = Protocol.IndexedDB.KeyPath;

export interface IDomStorageEvents {
  'dom-storage-updated': {
    type: 'localStorage' | 'sessionStorage' | 'indexedDB';
    securityOrigin: string;
    action: 'add' | 'update' | 'remove';
    timestamp: number;
    key: string;
    value?: string;
    meta?: any;
  };
}

export default class DomStorageTracker extends TypedEventEmitter<IDomStorageEvents> {
  public readonly storageByOrigin: {
    [origin: string]: IDomStorageForOrigin;
  };

  public isEnabled = false;

  protected readonly logger: IBoundLog;

  private readonly events = new EventSubscriber();
  private readonly devtoolsSession: DevtoolsSession;
  private readonly page: Page;
  private readonly networkManager: NetworkManager;
  private processingPromise = Promise.resolve();
  private readonly indexedDBListUpdatingOrigins = new Set<string>();
  private readonly indexedDBContentUpdatingOrigins = new Set<string>();

  private trackedOrigins = new Set<string>();

  constructor(
    page: Page,
    storageByOrigin: IDomStorage,
    networkManager: NetworkManager,
    logger: IBoundLog,
    isEnabled: boolean,
    session?: DevtoolsSession
  ) {
    super();
    this.isEnabled = isEnabled;
    this.page = page;
    session ??= page.devtoolsSession
    this.devtoolsSession = session;
    this.networkManager = networkManager;
    this.storageByOrigin = storageByOrigin ?? {};
    this.logger = logger.createChild(module);

    this.events.on(session, 'DOMStorage.domStorageItemAdded', this.onDomStorageAdded.bind(this));
    this.events.on(
      session,
      'DOMStorage.domStorageItemRemoved',
      this.onDomStorageRemoved.bind(this),
    );
    this.events.on(
      session,
      'DOMStorage.domStorageItemUpdated',
      this.onDomStorageUpdated.bind(this),
    );
    this.events.on(
      session,
      'DOMStorage.domStorageItemsCleared',
      this.onDomStorageCleared.bind(this),
    );

    this.events.on(session, 'Storage.indexedDBListUpdated', this.onIndexedDBListUpdated.bind(this));
    this.events.on(
      session,
      'Storage.indexedDBContentUpdated',
      this.onIndexedDBContentUpdated.bind(this),
    );
  }

  public close(): void {
    this.events.close();
    this.cancelPendingEvents('DomStorageTracker closed');
  }

  public reset(): void {
    for (const key of Object.keys(this.storageByOrigin)) delete this.storageByOrigin[key];
    this.indexedDBContentUpdatingOrigins.clear();
    this.indexedDBListUpdatingOrigins.clear();
    this.processingPromise = Promise.resolve();
    this.trackedOrigins.clear();
  }

  public async finalFlush(timeoutMs = 30e3): Promise<void> {
    this.events.close();
    await Promise.race([
      this.processingPromise,
      new Promise<void>(resolve => setTimeout(resolve, timeoutMs ?? 0)),
    ]);
  }

  public initialize(): Promise<void> {
    if (!this.isEnabled) return Promise.resolve();
    return Promise.all([
      this.devtoolsSession.send('DOMStorage.enable'),
      this.devtoolsSession.send('IndexedDB.enable'),
    ]).catch(err => err);
  }

  public isTracking(securityOrigin: string): boolean {
    return this.trackedOrigins.has(securityOrigin);
  }

  public track(securityOrigin: string): void {
    if (!this.isEnabled) return;
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
        if (error instanceof CanceledPromiseError) return;
        this.logger.info('Failed to watch Frame origin for storage changes', {
          securityOrigin,
          error,
        });
      });
  }

  public async getStorageByOrigin(): Promise<
    {
      frame?: IFrame;
      origin: string;
      databaseNames: string[];
      storageForOrigin: IDomStorageForOrigin;
    }[]
  > {
    const result: {
      frame?: IFrame;
      origin: string;
      databaseNames: string[];
      storageForOrigin: IDomStorageForOrigin;
    }[] = [];

    for (const origin of this.trackedOrigins) {
      const record = {
        frame: null,
        origin,
        databaseNames: [],
        storageForOrigin:
          this.storageByOrigin[origin] ??
          <IDomStorageForOrigin>{
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
          const { databaseNames } = await this.devtoolsSession.send(
            'IndexedDB.requestDatabaseNames',
            {
              securityOrigin: origin,
            },
          );
          record.databaseNames = databaseNames;
        }
      } catch (err) {
        // can throw if document not found in page
        record.frame = null;
      }
    }
    return result;
  }

  private storageForOrigin(securityOrigin: string): IDomStorageForOrigin {
    this.storageByOrigin[securityOrigin] ??= {
      indexedDB: [],
      localStorage: [],
      sessionStorage: [],
    };
    return this.storageByOrigin[securityOrigin];
  }

  private onDomStorageAdded(event: DomStorageItemAddedEvent): void {
    const timestamp = Date.now();
    const { isLocalStorage, securityOrigin } = event.storageId;

    const originStorage = this.storageForOrigin(securityOrigin);

    if (isLocalStorage) {
      originStorage.localStorage.push([event.key, event.newValue]);
    } else {
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

  private onDomStorageRemoved(event: DomStorageItemRemovedEvent): void {
    const timestamp = Date.now();
    const { isLocalStorage, securityOrigin } = event.storageId;

    const originStorage = this.storageForOrigin(securityOrigin);

    const list = isLocalStorage ? originStorage.localStorage : originStorage.sessionStorage;
    const index = list.findIndex(x => x[0] === event.key);
    if (index >= 0) list.splice(index, 1);

    this.emit('dom-storage-updated', {
      action: 'remove',
      type: isLocalStorage ? 'localStorage' : 'sessionStorage',
      securityOrigin,
      key: event.key,
      timestamp,
    });
  }

  private onDomStorageUpdated(event: DomStorageItemUpdatedEvent): void {
    const timestamp = Date.now();
    const { isLocalStorage, securityOrigin } = event.storageId;

    const originStorage = this.storageForOrigin(securityOrigin);

    const list = isLocalStorage ? originStorage.localStorage : originStorage.sessionStorage;
    const index = list.findIndex(x => x[0] === event.key);
    if (index >= 0) list[index][1] = event.newValue;

    this.emit('dom-storage-updated', {
      action: 'update',
      type: isLocalStorage ? 'localStorage' : 'sessionStorage',
      securityOrigin,
      key: event.key,
      value: event.newValue,
      timestamp,
    });
  }

  private onDomStorageCleared(event: DomStorageItemsClearedEvent): void {
    const timestamp = Date.now();
    const { isLocalStorage, securityOrigin } = event.storageId;

    const originStorage = this.storageForOrigin(securityOrigin);

    const list = isLocalStorage ? originStorage.localStorage : originStorage.sessionStorage;

    for (const [key] of list) {
      this.emit('dom-storage-updated', {
        action: 'remove',
        type: isLocalStorage ? 'localStorage' : 'sessionStorage',
        securityOrigin,
        key,
        timestamp,
      });
    }
  }

  private async onIndexedDBListUpdated(event: IndexedDBListUpdatedEvent): Promise<void> {
    const timestamp = Date.now();
    const securityOrigin = event.origin;
    if (this.indexedDBListUpdatingOrigins.has(securityOrigin)) return;
    this.indexedDBListUpdatingOrigins.add(securityOrigin);

    const resolvable = new Resolvable<void>();
    this.processingPromise = this.processingPromise.then(() => resolvable.promise);
    try {
      const dbs = await this.devtoolsSession.send('IndexedDB.requestDatabaseNames', {
        securityOrigin,
      });
      const originStorage = this.storageForOrigin(event.origin);
      const startNames = new Set(originStorage.indexedDB.map(x => x.name));
      for (const name of dbs.databaseNames) {
        const existing = startNames.has(name);
        if (existing) continue;

        const db = await this.getLatestIndexedDB(securityOrigin, name);
        if (!originStorage.indexedDB.some(x => x.name === name)) originStorage.indexedDB.push(db);

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
    } catch (error) {
      if (error instanceof CanceledPromiseError) return;
      if (error.code === -32000) return;
      this.logger.info('DomStorageTracker.onIndexedDBListUpdated:ERROR', {
        error,
        event,
      });
    } finally {
      this.indexedDBListUpdatingOrigins.delete(securityOrigin);
      resolvable.resolve();
    }
  }

  private async onIndexedDBContentUpdated(event: IndexedDBContentUpdatedEvent): Promise<void> {
    const { origin: securityOrigin, databaseName, objectStoreName } = event;
    if (this.indexedDBContentUpdatingOrigins.has(securityOrigin)) return;
    this.indexedDBContentUpdatingOrigins.add(securityOrigin);

    const timestamp = Date.now();
    const resolvable = new Resolvable<void>();
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
      } else {
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
    } catch (error) {
      if (error instanceof CanceledPromiseError) return;
      if (error.code === -32000) return;
      this.logger.info('DomStorageTracker.onIndexedDBContentUpdated', {
        error,
        event,
      });
    } finally {
      this.indexedDBContentUpdatingOrigins.delete(securityOrigin);
      resolvable.resolve();
    }
  }

  private async getLatestIndexedDB(
    securityOrigin: string,
    databaseName: string,
  ): Promise<IIndexedDB> {
    const { databaseWithObjectStores } = await this.devtoolsSession.send(
      'IndexedDB.requestDatabase',
      {
        databaseName,
        securityOrigin,
      },
    );
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

function flatKeypath(keypath: KeyPath): string | string[] | null {
  if (keypath.type === 'null') return null;
  if (keypath.type === 'string') return keypath.string;
  return keypath.array;
}
