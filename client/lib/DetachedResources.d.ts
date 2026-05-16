import ICoreSession from '../interfaces/ICoreSession';
import DetachedResource from './DetachedResource';
export default class DetachedResources {
    #private;
    constructor(coreSessionPromise: Promise<ICoreSession>, sessionIdPromise: Promise<string>);
    get names(): Promise<string[]>;
    get(name: string): Promise<DetachedResource>;
    getAll(name: string): Promise<DetachedResource[]>;
}
