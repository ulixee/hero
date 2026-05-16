import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IHeroReplayCreateOptions from '../interfaces/IHeroReplayCreateOptions';
import DetachedElements from './DetachedElements';
import DetachedResources from './DetachedResources';
import { InternalPropertiesSymbol } from './internal';
import CoreSession from './CoreSession';
export default class HeroReplay extends TypedEventEmitter<{
    connected: void;
}> {
    #private;
    get [InternalPropertiesSymbol](): {
        isConnected: boolean;
        coreSessionPromise: Promise<CoreSession>;
    };
    constructor(initializeOptions: IHeroReplayCreateOptions);
    get detachedElements(): DetachedElements;
    get detachedResources(): DetachedResources;
    getSnippet<T = any>(key: string): Promise<T>;
    get sessionId(): Promise<string>;
    close(): Promise<void>;
}
