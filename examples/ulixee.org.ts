import { Handler, Agent } from 'secret-agent';

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  async function getDatasetCost(agent: Agent) {
    const dataset = agent.input;
    let href = dataset.href;
    if (!href.startsWith('http')) href = `https://ulixee.org${href}`;
    console.log(href);
    await agent.goto(href);
    await agent.waitForPaintingStable();
    console.log('Page Loaded', href);
    const cost = await agent.document.querySelector('.cost .large-text').textContent;
    console.log('Cost of %s is %s', dataset.name, cost);
    agent.output.cost = cost;
  }

  handler.dispatchAgent(async agent => {
    await agent.goto('https://ulixee.org');
    const datasetLinks = await agent.document.querySelectorAll('a.DatasetSummary');
    for (const link of datasetLinks) {
      const name = await link.querySelector('.title').textContent;
      const href = await link.getAttribute('href');
      const input = { name, href };
      const agentOptions = { name, input };
      handler.dispatchAgent(getDatasetCost, agentOptions);
    }
  });

  await handler.waitForAllDispatches();
  await handler.close();
})();
