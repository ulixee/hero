import { Handler } from 'secret-agent';

(async function run() {
  const handler = new Handler();
  handler.dispatchAgent(async agent => {
    await agent.goto('https://news.ycombinator.com');
    await agent.waitForPaintingStable();
  });
  handler.dispatchAgent(async agent => {
    await agent.goto('https://news.ycombinator.com/newest');
    await agent.waitForPaintingStable();
  });
  await handler.waitForAllDispatches();
  await handler.close();
})();
