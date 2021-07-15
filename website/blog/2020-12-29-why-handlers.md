---
title: 'Scaling Hero Scrapes with Handlers'
path: /blog/handling-scale
date: 2020-12-29
summary: "We needed a simpler approach to scaling out to multiple machines running Hero and 1000s of waiting actions. So we added a new concept called Handlers."
---

When you start using Hero, you often copy and paste the default examples. As we started to use Hero on larger extraction efforts, it became clear that we didn't have a clear story for "how" you go from that starting example to running 2, or even 1000 scrapes.

As you start to think about structuring a bigger effort, a bunch of questions come up:

- Do you create a new Hero instance every time? Or do you simply add tabs?
- How expensive is it to create many instances?
- How should I make sure not to overload the host machine with the number of scrapes running at the same time?
- How do I add new machines when I max out the current one?

As we explored simplifying this story, we wanted to make the progression of "examples" through to full-scrapes a smooth process. Something like this:

#### Step 1: Try Out an Example

Trying out examples should require as little setup as possible, so we added a new `default export` that's a ready-to-go client for Hero.

```js
import hero from `@ulixee/hero`;

(async () => {
  // no initilization required!
  await hero.goto('https://ulixee.org');
  const datasetLinks = await hero.document.querySelectorAll('a.DatasetSummary');
  for (const link of datasetLinks) {
    const name = await link.querySelector('.title').textContent;
    const href = await link.getAttribute('href');
    const dataset = { name, href };
    console.log('Ulixee Dataset', dataset);
  }

  await hero.close();
})();
```

#### Step 2: Run Multiple Scrapes

Hero instances are lightweight, but what do you do when you need to queue up thousands of them to run. Until now, you've been on your own to use libraries like `p-queue`, keeping track of promises, or simply waiting and looping.

We introduced a new idea into Hero called a [`Handler`](/docs/basic-interfaces/handler) to help run multiple scrapes in one session. Handlers manage the concurrency of multiple scrapes to ensure your machine doesn't get overloaded and hang. We designed it so your code should require almost no changes to transition to many scrapes.

```js
import { Handler } from `@ulixee/hero`;

(async () => {
  const handler = new Handler({ maxConcurrency: 5 });

  handler.dispatchHero(async hero => {
    // hero is automatically created for us
    await hero.goto('https://ulixee.org');
    const datasetLinks = await hero.document.querySelectorAll('a.DatasetSummary');
    for (const link of datasetLinks) {
      const name = await link.querySelector('.title').textContent;
      const href = await link.getAttribute('href');
      const dataset = { name, href };

      // add a name to each hero so we can find each scrape on Replay
      const heroOptions = { name };
      handler.dispatchHero(getDatasetCost, dataset, heroOptions);
    }
  });

  // only 5 heros will be active at a given time until all are done
  await handler.waitForAllDispatches();
  await handler.close();
})();

// my data gets passed in once an hero is available
async function getDatasetCost(hero, dataset) {
  let { name, href } = dataset;
  if (!href.startsWith('http')) href = `https://ulixee.org${href}`;
  console.log(href);
  await hero.goto(href);
  await hero.waitForPaintingStable();
  const cost = await hero.document.querySelector('.cost .large-text').textContent;
  console.log('Cost of %s is %s', dataset.name, cost);
}
```

#### Step 3: Add Scraping Machines

You might find that you need to increase the speed of your scrapes. So the next transition you'll likely want to make is to add remote machines. Handlers are built to round-robin between multiple [`ConnectionToCore`](/docs/advanced/connection-to-core) instances.

```js
import { Handler } from `@ulixee/hero`;

(async () => {
  const handler = new Handler(
    {
      maxConcurrency: 5,
      host: '192.168.1.1:2300', // fictional remote hero #1
    },
    {
      maxConcurrency: 5,
      host: '192.168.1.2:2300', // fictional remote hero #2
    },
  );
  
// ... everything else is the same!

  handler.dispatchHero(async hero => {
    // hero is automatically created for us
    await hero.goto('https://ulixee.org');
    ...
```


#### Default Exports

To get to this setup, you'll notice some changes in the default exports when you install Hero 1.3.0-alpha.1. The default exports that come out of the `@ulixee/hero` package is now a pre-initialized instance of the `Hero` class.

[`Handler`](/docs/basic-interfaces/handler) and [`Hero`](/docs/basic-interfaces/hero) are available as exports from `@ulixee/hero` if you'd like to continue to use those. To customize a "Remote" `Hero` for an [`Hero`](/docs/basic-interfaces/hero), you can create a new instance with a [`connectionToCore`](/docs/basic-interfaces/hero#constructor) parameter, or use the [`.configure()`](/docs/basic-interfaces/hero#configure) function.


#### That's it!

That's our change. We hope it leads to a very simple model to understand how to scale up your Hero instances. Feedback is welcome as always on any of our channels (listed in header)!
