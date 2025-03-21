import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import SessionDb from '../dbs/SessionDb';
export default class DetachedAssets {
    static getNames(db: SessionDb): Promise<{
        resources: string[];
        elements: string[];
        snippets: string[];
    }>;
    static getSnippets(db: SessionDb, name: string): IDataSnippet[];
    static getResources(db: SessionDb, name: string): Promise<IDetachedResource[]>;
    static getElements(db: SessionDb, name: string): IDetachedElement[];
}
