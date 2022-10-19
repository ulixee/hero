import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';

// This interface exists for DataboxInternal to import

export default interface ICoreSession {
  sessionId: string;
  setSnippet(key: string, value: any): Promise<void>;
  getSnippets(sessionId: string, key: string): Promise<IDataSnippet[]>;
  getCollectedAssetNames(sessionId: string): Promise<{ resources: string[]; elements: string[]; snippets: string[] }>;
  getDetachedElements(sessionId: string, name: string): Promise<IDetachedElement[]>;
  getDetachedResources(sessionId: string, name: string): Promise<IDetachedResource[]>;
  recordOutput(changes: IOutputChangeToRecord[]): void
}

export interface IOutputChangeToRecord {
  type: string;
  value: any;
  path: string;
  timestamp: number;
}
