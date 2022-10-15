import { DOMParser } from 'linkedom';

export default class DetachedDOM {
  static #domParser = new DOMParser();

  public static loadFragment(outerHTML: string): Element {
    return this.#domParser.parseFromString(outerHTML, 'text/html').firstChild;
  }
}