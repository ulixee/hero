import Hero from "./Hero";
import IHeroCreateOptions from "../interfaces/IHeroCreateOptions";
import CollectedElements from "./CollectedElements";
import CollectedResources from "./CollectedResources";
import CollectedSnippets from "./CollectedSnippets";

interface IHeroPastCreateOptions extends IHeroCreateOptions {
  extractSessionId: string;
}

export default class HeroPast {
  #hero: Hero;

  constructor(initializeOptions: IHeroPastCreateOptions) {
    this.#hero = new Hero(initializeOptions);
  }

  public get collectedElements(): CollectedElements {
    return this.#hero.collectedElements;
  }

  public get collectedSnippets(): CollectedSnippets {
    return this.#hero.collectedSnippets;
  }

  public get collectedResources(): CollectedResources {
    return this.#hero.collectedResources;
  }

  public get sessionId(): Promise<string> {
    return this.#hero.sessionId;
  }
}