import '@ulixee/commons/lib/SourceMapSupport';
import DefaultHero, { IHeroCreateOptions } from '@ulixee/hero';
import Core from '@ulixee/hero-core';
export * from '@ulixee/hero';
export { Core };
export default class Hero extends DefaultHero {
    constructor(createOptions?: IHeroCreateOptions);
}
