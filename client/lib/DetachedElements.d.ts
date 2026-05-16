import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import ICoreSession from '../interfaces/ICoreSession';
export default class DetachedElements {
    #private;
    constructor(coreSessionPromise: Promise<ICoreSession>, sessionIdPromise: Promise<string>);
    get names(): Promise<string[]>;
    getRawDetails(name: string): Promise<IDetachedElement[]>;
    getRawDetailsByElement(element: Element): IDetachedElement;
    get(name: string): Promise<Element>;
    getAll(name: string): Promise<Element[]>;
}
