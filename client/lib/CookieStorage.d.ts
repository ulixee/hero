import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';
import CoreFrameEnvironment from './CoreFrameEnvironment';
export default class CookieStorage {
    #private;
    constructor(coreFrame: Promise<CoreFrameEnvironment>);
    get length(): Promise<number>;
    getItems(): Promise<ICookie[]>;
    key(index: number): Promise<string>;
    clear(): Promise<void>;
    getItem(key: string): Promise<ICookie>;
    setItem(key: string, value: string, options?: ISetCookieOptions): Promise<boolean>;
    removeItem(name: string): Promise<boolean>;
}
export declare function createCookieStorage(coreFrame: Promise<CoreFrameEnvironment>): CookieStorage;
