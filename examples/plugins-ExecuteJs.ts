import Core from '@ulixee/hero-core';
import Hero from '@ulixee/hero'
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

Core.use(ExecuteJsPlugin);

// NOTE: You need to start a Ulixee Cloud **in this same process** to run this example
import './server'

(async function main() {
  const hero = new Hero();
  hero.use(ExecuteJsPlugin);

  await hero.goto('https://ulixee.org');
  await hero.activeTab.waitForPaintingStable();
  const divs = await hero.executeJs(() => {
    // @ts-ignore
    return window.document.querySelectorAll('div').length;
  });
  console.log('Divs on https://ulixee.org?', divs);
  await hero.close();
})();
