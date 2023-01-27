import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Hero from './Hero';
import IHeroReplayCreateOptions from '../interfaces/IHeroReplayCreateOptions';
import DetachedElements from './DetachedElements';
import DetachedResources from './DetachedResources';
import IHeroCreateOptions from '../interfaces/IHeroCreateOptions';
import { InternalPropertiesSymbol } from './internal';
import CoreSession from './CoreSession';

export default class HeroReplay extends TypedEventEmitter<{ connected: void }> {
  #hero: Hero;

  get [InternalPropertiesSymbol](): {
    isConnected: boolean;
    coreSessionPromise: Promise<CoreSession>;
  } {
    return this.#hero[InternalPropertiesSymbol];
  }

  constructor(initializeOptions: IHeroReplayCreateOptions) {
    super();
    if ('hero' in initializeOptions) {
      this.#hero = initializeOptions.hero;
    } else {
      this.#hero = new Hero(initializeOptions as IHeroCreateOptions);
    }
    if (this.#hero[InternalPropertiesSymbol].isConnected) {
      process.nextTick(this.emit.bind(this, 'connected'));
    } else {
      void this.#hero.once('connected', this.emit.bind(this, 'connected'));
    }
  }

  public get detachedElements(): DetachedElements {
    return this.#hero.detachedElements;
  }

  public get detachedResources(): DetachedResources {
    return this.#hero.detachedResources;
  }

  public getSnippet<T = any>(key: string): Promise<T> {
    return this.#hero.getSnippet<T>(key);
  }

  public get sessionId(): Promise<string> {
    return this.#hero.sessionId;
  }

  public close(): Promise<void> {
    return this.#hero.close();
  }
}
