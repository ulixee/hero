// NOTE: You need to start a Ulixee Cloud to run this example

import Queue from 'p-queue';
import Hero from '@ulixee/hero';

(async () => {
  let cost = '0';
  async function getDatasetCost({ name, href }) {
    if (!href.startsWith('http')) href = `https://ulixee.org${href}`;
    const hero = new Hero();
    console.log(href);
    await hero.goto(href);
    await hero.waitForPaintingStable();
    console.log('Page Loaded', href);
    cost = await hero.document.querySelector('.cost .large-text').textContent;
    console.log('Cost of %s is %s', name, cost);
    await hero.close();
  }

  const queue = new Queue({ concurrency: 2 });
  const hero = new Hero();
  await hero.goto('https://ulixee.org');
  const datasetLinks = await hero.document.querySelectorAll('a.DatasetSummary');

  for (const link of datasetLinks) {
    const name = await link.querySelector('.title').textContent;
    const href = await link.getAttribute('href');
    queue.add(() => getDatasetCost({ name, href }));
  }

  await hero.close();
  await queue.onIdle();

  console.log({ cost });
})();
