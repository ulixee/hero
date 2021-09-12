import Hero, { Core } from '@ulixee/hero-fullstack';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

Core.use(ExecuteJsPlugin);

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
