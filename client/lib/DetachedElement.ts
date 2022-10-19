import { DOMParser } from 'linkedom';

export default class DetachedElement {
  static #domParser = new DOMParser();

  public static load(outerHTML: string): Element {
    return this.#domParser.parseFromString(outerHTML, 'text/html').firstChild;
  }
}