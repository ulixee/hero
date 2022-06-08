import Hero from '@ulixee/hero';
import { ClientPlugin } from '@ulixee/hero-plugin-utils';

// NOTE: You need to start a Ulixee Server to run this example

export default class ClientHelloPlugin extends ClientPlugin {
  static override readonly id = 'client-hello-plugin';

  async onHero(hero, sendToCore) {
    console.log('Hello Hero %s', await hero.sessionId);
  }
}

(async function main() {
  const hero = new Hero();
  hero.use(ClientHelloPlugin);

  await hero.goto('https://ulixee.org');
  await hero.activeTab.waitForPaintingStable();
  await hero.close();
})();
