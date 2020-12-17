---
title: 'Scaling SecretAgent Scrapes with Handlers'
path: /handling-scale
date: 2020-12-29
summary: "We needed a simpler approach to scaling out to multiple machines running SecretAgent and 1000s of waiting actions. So we added a new concept called Handlers."
---

When you start using SecretAgent, you often copy and paste the default examples. As we started to use SecretAgent on larger extraction efforts, it became clear that we didn't have a clear story for "how" you go from that starting example to running 2, or even 1000 scrapes.

As you start to think about structuring a bigger effort, a bunch of questions come up:

- Do you create a new SecretAgent instance every time? Or do you simply add tabs?
- How expensive is it to create many instances?
- How should I make sure not to overload the host machine with the number of scrapes running at the same time?
- How do I add new machines when I max out the current one?

As we explored simplifying this story, we wanted to make the progression of "examples" through to full-scrapes a smooth process. Something like this:

#### Step 1: Try Out an Example

Trying out examples should require as little setup as possible, so we added a new `default export` that's a ready-to-go client for SecretAgent.

```js
import agent from 'secret-agent';

(async () => {
  // no initilization required!
  await agent.goto('https://ulixee.org');
  const datasetLinks = await agent.document.querySelectorAll('a.DatasetSummary');
  for (const link of datasetLinks) {
    const name = await link.querySelector('.title').textContent;
    const href = await link.getAttribute('href');
    const dataset = { name, href };
    console.log('Ulixee Dataset', dataset);
  }

  await agent.close();
})();
```

#### Step 2: Run Multiple Scrapes

Agent instances are lightweight, but what do you do when you need to queue up thousands of them to run. Until now, you've been on your own to use libraries like `p-queue`, keeping track of promises, or simply waiting and looping.

We introduced a new idea into SecretAgent called a [`Handler`](/docs/basic-interfaces/handler) to help run multiple scrapes in one session. Handlers manage the concurrency of multiple scrapes to ensure your machine doesn't get overloaded and hang. We designed it so your code should require almost no changes to transition to many scrapes.

```js
import { Handler } from 'secret-agent';

(async () => {
  const handler = new Handler({ maxConcurrency: 5 });

  handler.dispatchAgent(async agent => {
    // agent is automatically created for us
    await agent.goto('https://ulixee.org');
    const datasetLinks = await agent.document.querySelectorAll('a.DatasetSummary');
    for (const link of datasetLinks) {
      const name = await link.querySelector('.title').textContent;
      const href = await link.getAttribute('href');
      const dataset = { name, href };

      // add a name to each agent so we can find each scrape on Replay
      const agentOptions = { name };
      handler.dispatchAgent(getDatasetCost, link, agentOptions);
    }
  });

  // only 5 agents will be active at a given time until all are done
  await handler.waitForAllDispatches();
  await handler.close();
})();

// my data gets passed in once an agent is available
async function getDatasetCost(agent, dataset) {
  const { name, href } = dataset;
  if (!href.startsWith('http')) href = `https://ulixee.org${href}`;
  console.log(href);
  await agent.goto(href);
  await agent.waitForAllContentLoaded();
  const cost = await agent.document.querySelector('.cost .large-text').textContent;
  console.log('Cost of %s is %s', dataset.name, cost);
}
```

#### Step 3: Add Scraping Machines

You might find that you need to increase the speed of your scrapes. So the next transition you'll likely want to make is to add remote machines. Handlers are built to round-robin between multiple [`CoreConnections`](/docs/advanced/core-connection).

```js
import { Handler } from 'secret-agent';

(async () => {
  const handler = new Handler(
    {
      maxConcurrency: 5,
      host: '192.168.1.1:2300', // fictional remote secret-agent #1
    },
    {
      maxConcurrency: 5,
      host: '192.168.1.2:2300', // fictional remote secret-agent #2
    },
  );
  
// ... everything else is the same!

  handler.dispatchAgent(async agent => {
    // agent is automatically created for us
    await agent.goto('https://ulixee.org');
    ...
```


#### Default Exports

To get to this setup, you'll notice some changes in the default exports when you install SecretAgent 1.3.0-alpha.1. The default exports that come out of the `secret-agent` and `@secret-agent/client` packages is now a pre-initialized instance of the `Agent` class (`SecretAgent` was renamed to `Agent`).

[`Handler`](/docs/basic-interfaces/handler) and [`Agent`](/docs/basic-interfaces/agent) are available as exports from both the `secret-agent` and `@secret-agent/client` if you'd like to continue to use those. To customize a "Remote" `SecretAgent` for an [`Agent`](/docs/basic-interfaces/agent), you can create a new instance with a [`coreConnection`](/docs/basic-interfaces/agent#constructor) parameter, or use the [`.configure()`](/docs/basic-interfaces/agent#configure) function.


#### That's it!

That's our change. We hope it leads to a very simple model to understand how to scale up your SecretAgent instances. Feedback is welcome as always on any of our channels (listed in header)!
