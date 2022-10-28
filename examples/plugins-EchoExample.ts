import Core from '@ulixee/hero-core';
import Hero from '@ulixee/hero';
import * as Path from 'path';

// NOTE: You need to start a Ulixee Miner **in this same process** to run this example
import './server';

async function run() {
  // For security, need to explicitly activate dynamic loading to allow Core to load a random path.
  Core.allowDynamicPluginLoading = true;
  const hero = new Hero();
  hero.use(Path.join(__dirname, 'plugins-EchoClasses.js'));
  /**
   * Or install into Core and client
   * Core.use(require('./plugin-echo-classes'));
   * hero.use(require('./plugin-echo-classes'));
   **/

  await hero.goto('https://example.org/');
  await hero.waitForPaintingStable();
  const result = await hero.echo('Echo', 1, 2, 3, true);
  console.log('Echo result', {
    sent: ['Echo', 1, 2, 3, true],
    result,
  });
  await hero.close();
  await Core.shutdown();
}

run().catch(error => console.log(error));
