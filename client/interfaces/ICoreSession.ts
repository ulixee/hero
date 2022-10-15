import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';

// This interface exists for DataboxInternal to import

export default interface ICoreSession {
  sessionId: string;
  collectSnippet(name: string, value: any): Promise<void>;
  getCollectedAssetNames(sessionId: string): Promise<{ resources: string[]; elements: string[]; snippets: string[] }>;
  getCollectedSnippets(sessionId: string, name: string): Promise<ICollectedSnippet[]>;
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
