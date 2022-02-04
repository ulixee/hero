import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import ICollectedResource from '@ulixee/hero-interfaces/ICollectedResource';

// This interface exists for DataboxInternal to import

export default interface ICoreSession {
  sessionId: string;
  collectSnippet(name: string, value: any): Promise<void>;
  getCollectedSnippets(sessionId: string, name: string): Promise<ICollectedSnippet[]>;
  getCollectedElements(sessionId: string, name: string): Promise<ICollectedElement[]>;
  getCollectedResources(sessionId: string, name: string): Promise<ICollectedResource[]>;
  recordOutput(changes: IOutputChangeToRecord[]): void
}

export interface IOutputChangeToRecord {
  type: string;
  value: any;
  path: string;
  timestamp: number;
}
