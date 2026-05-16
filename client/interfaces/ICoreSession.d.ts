import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
export default interface ICoreSession extends ITypedEventEmitter<{
    close: void;
}> {
    sessionId: string;
    setSnippet(key: string, value: any): Promise<void>;
    getSnippets(sessionId: string, key: string): Promise<IDataSnippet[]>;
    getCollectedAssetNames(sessionId: string): Promise<{
        resources: string[];
        elements: string[];
        snippets: string[];
    }>;
    getDetachedElements(sessionId: string, name: string): Promise<IDetachedElement[]>;
    getDetachedResources(sessionId: string, name: string): Promise<IDetachedResource[]>;
    recordOutput(changes: IOutputChangeToRecord[]): void;
}
export interface IOutputChangeToRecord {
    type: string;
    value: any;
    path: string;
    timestamp: number;
}
