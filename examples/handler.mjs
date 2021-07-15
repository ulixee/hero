import { Handler } from '@ulixee/hero';

(async function run() {
  const handler = new Handler();
  handler.dispatchHero(async agent => {
    await agent.goto('https://news.ycombinator.com');
    await agent.waitForPaintingStable();
  });
  handler.dispatchHero(async agent => {
    await agent.goto('https://news.ycombinator.com/newest');
    await agent.waitForPaintingStable();
  });
  await handler.waitForAllDispatches();
  await handler.close();
})();
