import IDomState, { IDomStateAssertions } from '@ulixee/hero-interfaces/IDomState';

export default class DomState implements IDomState {
  public name?: string;
  public url?: string | RegExp;
  public allTrue: (options: IDomStateAssertions) => void;

  constructor(options: IDomState) {
    this.name = options.name;
    this.url = options.url;
    this.allTrue = options.allTrue;
  }
}
