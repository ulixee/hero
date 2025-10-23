import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IDomStorage, { IDomStorageForOrigin } from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import DevtoolsSession from './DevtoolsSession';
import NetworkManager from './NetworkManager';
import Page from './Page';
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
    readonly storageByOrigin: {
        [origin: string]: IDomStorageForOrigin;
    };
    isEnabled: boolean;
    protected readonly logger: IBoundLog;
    private readonly events;
    private readonly devtoolsSession;
    private readonly page;
    private readonly networkManager;
    private processingPromise;
    private readonly indexedDBListUpdatingOrigins;
    private readonly indexedDBContentUpdatingOrigins;
    private trackedOrigins;
    constructor(page: Page, storageByOrigin: IDomStorage, networkManager: NetworkManager, logger: IBoundLog, isEnabled: boolean, session?: DevtoolsSession);
    close(): void;
    reset(): void;
    finalFlush(timeoutMs?: number): Promise<void>;
    initialize(): Promise<void>;
    isTracking(securityOrigin: string): boolean;
    track(securityOrigin: string): void;
    getStorageByOrigin(): Promise<{
        frame?: IFrame;
        origin: string;
        databaseNames: string[];
        storageForOrigin: IDomStorageForOrigin;
    }[]>;
    private storageForOrigin;
    private onDomStorageAdded;
    private onDomStorageRemoved;
    private onDomStorageUpdated;
    private onDomStorageCleared;
    private onIndexedDBListUpdated;
    private onIndexedDBContentUpdated;
    private getLatestIndexedDB;
}
