import { IDomStorageForOrigin } from './IDomStorage';
import { IPuppetFrame } from './IPuppetFrame';

export default interface IPuppetDomStorageTracker {
  getStorageByOrigin(): Promise<
    {
      frame?: IPuppetFrame;
      origin: string;
      databaseNames: string[];
      storageForOrigin: IDomStorageForOrigin;
    }[]
  >;
  finalFlush(timeoutMs?: number): Promise<void>;
}

export interface IPuppetStorageEvents {
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
