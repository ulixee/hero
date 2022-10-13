/// <reference lib="DOM" />
/// <reference lib="DOM.Iterable" />
import { DOMParser } from 'linkedom';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import ICoreSession from '../interfaces/ICoreSession';

export default class CollectedElements {
  static #domParser = new DOMParser();

  #collectedElementsByName = new Map<string, ICollectedElement[]>();
  readonly #coreSessionPromise: Promise<ICoreSession>;
  readonly #sessionIdPromise: Promise<string>;
  readonly #rawDetailsByElement: Map<Element, ICollectedElement> = new Map();

  constructor(coreSessionPromise: Promise<ICoreSession>, sessionIdPromise: Promise<string>) {
    this.#coreSessionPromise = coreSessionPromise;
    this.#sessionIdPromise = sessionIdPromise;
  }

  get names(): Promise<string[]> {
    return Promise.all([this.#coreSessionPromise, this.#sessionIdPromise]).then(
      async ([coreSession, sessionId]) => {
        const names = await coreSession.getCollectedAssetNames(sessionId);
        return names.elements;
      },
    );
  }

  async getRawDetails(name: string): Promise<ICollectedElement[]> {
    if (this.#collectedElementsByName.has(name)) return this.#collectedElementsByName.get(name);
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const elements = await coreSession.getCollectedElements(sessionId, name);
    this.#collectedElementsByName.set(name, elements);
    return elements;
  }

  getRawDetailsByElement(element: Element): ICollectedElement {
    return this.#rawDetailsByElement.get(element)  ;
  }

  async get(name: string): Promise<Element> {
    const collectedElements = await this.getRawDetails(name);
    if (collectedElements.length === 0) return null;
    const element = CollectedElements.parseIntoFrozenDom(collectedElements[0].outerHTML);
    this.#rawDetailsByElement.set(element, collectedElements[0]);
    return element;
  }

  async getAll(name: string): Promise<Element[]> {
    const collectedElements = await this.getRawDetails(name);
    if (collectedElements.length === 0) return null;
    return collectedElements.map(x => {
      const element = CollectedElements.parseIntoFrozenDom(x.outerHTML);
      this.#rawDetailsByElement.set(element, collectedElements[0]);
      return element;
    });
  }

  public static parseIntoFrozenDom(outerHTML: string): Element {
    return this.#domParser.parseFromString(outerHTML, 'text/html').firstChild;
  }
}
