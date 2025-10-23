import IDomState, { IDomStateAssertions } from '@ulixee/hero-interfaces/IDomState';
export default class DomState implements IDomState {
    url?: string | RegExp;
    all: (options: IDomStateAssertions) => void;
    constructor(options: IDomState);
}
