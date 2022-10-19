import Hero from "./Hero";
import IHeroReplayCreateOptions from "../interfaces/IHeroReplayCreateOptions";
import DetachedElements from "./DetachedElements";
import DetachedResources from "./DetachedResources";


export default class HeroReplay {
  #hero: Hero;

  constructor(initializeOptions: IHeroReplayCreateOptions) {
    if (initializeOptions.hero) {
      this.#hero = initializeOptions.hero
    } else {
      this.#hero = new Hero(initializeOptions);
    }
  }

  public get detachedElements(): DetachedElements {
    return this.#hero.detachedElements;
  }

  public get detachedResources(): DetachedResources {
    return this.#hero.detachedResources;
  }

  public get sessionId(): Promise<string> {
    return this.#hero.sessionId;
  }

  public close(): Promise<void> {
    return this.#hero.close();
  }

  public getSnippet<T = any>(key: string): Promise<T> {
    return this.#hero.getSnippet<T>(key);
  }
}