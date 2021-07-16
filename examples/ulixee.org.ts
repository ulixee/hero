import { Handler, Hero } from '@ulixee/hero-full-client';

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  async function getDatasetCost(hero: Hero) {
    const dataset = hero.input;
    let href = dataset.href;
    if (!href.startsWith('http')) href = `https://ulixee.org${href}`;
    console.log(href);
    await hero.goto(href);
    await hero.waitForPaintingStable();
    console.log('Page Loaded', href);
    const cost = await hero.document.querySelector('.cost .large-text').textContent;
    console.log('Cost of %s is %s', dataset.name, cost);
    hero.output.cost = cost;
  }

  handler.dispatchHero(async hero => {
    await hero.goto('https://ulixee.org');
    const datasetLinks = await hero.document.querySelectorAll('a.DatasetSummary');
    for (const link of datasetLinks) {
      const name = await link.querySelector('.title').textContent;
      const href = await link.getAttribute('href');
      const input = { name, href };
      const heroOptions = { name, input };
      handler.dispatchHero(getDatasetCost, heroOptions);
    }
  });

  await handler.waitForAllDispatches();
  await handler.close();
})();
