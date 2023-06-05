/// <reference lib="DOM" />
/// <reference lib="DOM.Iterable" />
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import ICoreSession from '../interfaces/ICoreSession';
import DetachedElement from './DetachedElement';

export default class DetachedElements {
  #detachedElementsByName = new Map<string, IDetachedElement[]>();
  readonly #coreSessionPromise: Promise<ICoreSession>;
  readonly #sessionIdPromise: Promise<string>;
  readonly #rawDetailsByElement: Map<Element, IDetachedElement> = new Map();

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

  async getRawDetails(name: string): Promise<IDetachedElement[]> {
    if (this.#detachedElementsByName.has(name)) return this.#detachedElementsByName.get(name);
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const elements = await coreSession.getDetachedElements(sessionId, name);
    this.#detachedElementsByName.set(name, elements);
    return elements;
  }

  getRawDetailsByElement(element: Element): IDetachedElement {
    return this.#rawDetailsByElement.get(element);
  }

  async get(name: string): Promise<Element> {
    const detachedElements = await this.getRawDetails(name);
    if (detachedElements.length === 0) return null;
    const element = DetachedElement.load(detachedElements[0].outerHTML);
    this.#rawDetailsByElement.set(element, detachedElements[0]);
    return element;
  }

  async getAll(name: string): Promise<Element[]> {
    const detachedElements = await this.getRawDetails(name);
    return detachedElements.map(x => {
      const element = DetachedElement.load(x.outerHTML);
      this.#rawDetailsByElement.set(element, detachedElements[0]);
      return element;
    });
  }
}
