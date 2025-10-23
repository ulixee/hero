import DefaultHero, { ConnectionToHeroCore, IHeroCreateOptions } from '@ulixee/hero';
export default class TestHero extends DefaultHero {
    constructor(createOptions?: IHeroCreateOptions);
    static getDirectConnectionToCore(): ConnectionToHeroCore;
}
