import Hero from './Hero';
import IHeroReplayCreateOptions from '../interfaces/IHeroReplayCreateOptions';
import DetachedElements from './DetachedElements';
import DetachedResources from './DetachedResources';
import IHeroCreateOptions from '../interfaces/IHeroCreateOptions';

export default class HeroReplay {
  #hero: Hero;

  constructor(initializeOptions: IHeroReplayCreateOptions) {
    if ('hero' in initializeOptions) {
      this.#hero = initializeOptions.hero;
    } else {
      this.#hero = new Hero(initializeOptions as IHeroCreateOptions);
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
