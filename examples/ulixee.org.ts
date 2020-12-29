import { Handler, Agent } from '@secret-agent/full-client';

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  async function getDatasetCost(agent: Agent, dataset: { name: string; href: string }) {
    let href = dataset.href;
    if (!href.startsWith('http')) href = `https://ulixee.org${href}`;
    console.log(href);
    await agent.goto(href);
    await agent.waitForAllContentLoaded();
    console.log('Page Loaded', href);
    const cost = await agent.document.querySelector('.cost .large-text').textContent;
    console.log('Cost of %s is %s', dataset.name, cost);
  }

  handler.dispatchAgent(async agent => {
    await agent.goto('https://ulixee.org');
    const links = await agent.document.querySelectorAll('a.DatasetSummary');
    for (const link of links) {
      const name = await link.querySelector('.title').textContent;
      const href = await link.getAttribute('href');
      const dataset = { name, href };
      const agentOptions = { name };
      handler.dispatchAgent(getDatasetCost, dataset, agentOptions);
    }
  });

  await handler.waitForAllDispatches();
})();
