import IDomState, { IDomStateAssertions } from '@ulixee/hero-interfaces/IDomState';

export default class DomState implements IDomState {
  public url?: string | RegExp;
  public all: (options: IDomStateAssertions) => void;

  constructor(options: IDomState) {
    this.url = options.url;
    this.all = options.all;
  }
}
