import Protocol from 'devtools-protocol';
import * as eventUtils from '@ulixee/commons/lib/eventUtils';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { DevtoolsSession } from './DevtoolsSession';
import { NetworkManager } from './NetworkManager';
import IDomStorage, { IDomStorageForOrigin } from '@ulixee/hero-interfaces/IDomStorage';
import { IIndexedDB } from '@ulixee/hero-interfaces/IIndexedDB';
import IPuppetDomStorageTracker, {
  IPuppetStorageEvents,
} from '@ulixee/hero-interfaces/IPuppetDomStorageTracker';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { Page } from './Page';
import { IPuppetFrame } from '@ulixee/hero-interfaces/IPuppetFrame';
import DomStorageItemAddedEvent = Protocol.DOMStorage.DomStorageItemAddedEvent;
import DomStorageItemRemovedEvent = Protocol.DOMStorage.DomStorageItemRemovedEvent;
import DomStorageItemUpdatedEvent = Protocol.DOMStorage.DomStorageItemUpdatedEvent;
import DomStorageItemsClearedEvent = Protocol.DOMStorage.DomStorageItemsClearedEvent;
import IndexedDBListUpdatedEvent = Protocol.Storage.IndexedDBListUpdatedEvent;
import IndexedDBContentUpdatedEvent = Protocol.Storage.IndexedDBContentUpdatedEvent;
import KeyPath = Protocol.IndexedDB.KeyPath;

export class DomStorageTracker
  extends TypedEventEmitter<IPuppetStorageEvents>
  implements IPuppetDomStorageTracker
{
  public readonly storageByOrigin: {
    [origin: string]: IDomStorageForOrigin;
  };

  protected readonly logger: IBoundLog;

  private readonly registeredEvents: IRegisteredEventListener[] = [];
  private readonly devtoolsSession: DevtoolsSession;
  private readonly page: Page;
  private readonly networkManager: NetworkManager;
  private processingPromise = Promise.resolve();
  private readonly indexedDBListUpdatingOrigins = new Set<string>();
  private readonly indexedDBContentUpdatingOrigins = new Set<string>();

  private trackedOrigins = new Set<string>();
  private isEnabled = false;

  constructor(
    page: Page,
    storageByOrigin: IDomStorage,
    networkManager: NetworkManager,
    logger: IBoundLog,
    isEnabled: boolean,
  ) {
    super();
    this.isEnabled = isEnabled;
    this.page = page;
    this.devtoolsSession = page.devtoolsSession;
    this.networkManager = networkManager;
    this.storageByOrigin = storageByOrigin ?? {};
    this.logger = logger.createChild(module);
    this.registeredEvents = eventUtils.addEventListeners(this.devtoolsSession, [
      ['DOMStorage.domStorageItemAdded', this.onDomStorageAdded.bind(this)],
      ['DOMStorage.domStorageItemRemoved', this.onDomStorageRemoved.bind(this)],
      ['DOMStorage.domStorageItemUpdated', this.onDomStorageUpdated.bind(this)],
      ['DOMStorage.domStorageItemsCleared', this.onDomStorageCleared.bind(this)],

      ['Storage.indexedDBListUpdated', this.onIndexedDBListUpdated.bind(this)],
      ['Storage.indexedDBContentUpdated', this.onIndexedDBContentUpdated.bind(this)],
    ]);
  }

  public close(): void {
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('DomStorageTracker closed');
  }

  public async finalFlush(timeoutMs = 30e3): Promise<void> {
    eventUtils.removeEventListeners(this.registeredEvents);
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
        this.logger.info('Failed to watch PuppetFrame origin for storage changes', {
          securityOrigin,
          error,
        });
      });
  }

  public async getStorageByOrigin(): Promise<
    {
      frame?: IPuppetFrame;
      origin: string;
      databaseNames: string[];
      storageForOrigin: IDomStorageForOrigin;
    }[]
  > {
    const result: {
      frame?: IPuppetFrame;
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
        record.frame = this.page.frames.find(x => x.securityOrigin === origin);

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
      this.logger.error('DomStorageTracker.onIndexedDBListUpdated', {
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
      this.logger.error('DomStorageTracker.onIndexedDBContentUpdated', {
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
