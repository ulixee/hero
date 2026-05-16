import Hero from '@ulixee/hero';
import { ClientPlugin } from '@ulixee/hero-plugin-utils';
declare module '@ulixee/hero/lib/extendables' {
    interface Hero {
        revealAnswers(selector?: string): Promise<any>;
    }
}
export default class HeroExtensionPlugin extends ClientPlugin {
    static readonly id = "hero-extension-plugin";
    onHero(hero: Hero): void;
}
