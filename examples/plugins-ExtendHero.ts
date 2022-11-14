import Hero from '@ulixee/hero';
import { ClientPlugin } from '@ulixee/hero-plugin-utils';

// NOTE: You need to start a Ulixee Miner to run this example

declare module '@ulixee/hero/lib/extendables' {
  interface Hero {
    revealAnswers();
  }
}
export default class HeroExtensionPlugin extends ClientPlugin {
  static override readonly id = 'hero-extension-plugin';

  onHero(hero: Hero) {
    // define your own hero function,
    // which internally can make use of the actual `Hero` instance,
    // by including it in your own clojure-as-a-method!
    hero.revealAnswers = async (selector?: string) =>
      await hero.querySelectorAll(selector ?? 'li.question').$map(link => link.$click());
  }
}

(async function main() {
  const hero = new Hero();
  hero.use(HeroExtensionPlugin);

  await hero.goto('https://cdpn.io/alexs/fullpage/AJGEWY');
  await hero.activeTab.waitForPaintingStable();

  // you now have the ability to use your own custom function :)
  await hero.revealAnswers();

  await hero.close();
})();
