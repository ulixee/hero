import agent from 'secret-agent';

// process.env.SA_SHOW_BROWSER = 'true';

async function run() {
  await agent.configure({ userAgent: 'chrome-latest' });
  await agent.goto('https://news.ycombinator.com/');
  await agent.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await agent.url);

  const results = [];

  const stories = await agent.document.querySelectorAll('.athing');
  let lastStory;
  for (const story of stories) {
    await agent.waitForMillis(200);
    const extraElem = await story.nextElementSibling;
    await agent.interact({
      move: story,
    });

    const titleElem = await story.querySelector('a.storylink');

    let score;
    try {
      score = parseInt((await extraElem.querySelector('.score').textContent) ?? '0', 10);
    } catch (error) {
      score = 0;
    }
    const id = await story.getAttribute('id');
    const age = await extraElem.querySelector('.age a').textContent;
    const title = await titleElem.textContent;

    let contributor;
    try {
      contributor = await extraElem.querySelector('.hnuser').textContent;
    } catch (error) {
      contributor = '';
    }

    const links = [...(await extraElem.querySelectorAll('.subtext > a'))];
    const commentsLink = links[links.length - 1];
    const commentText = await commentsLink.textContent;
    const commentCount = commentText.includes('comment')
      ? parseInt(commentText.trim().match(/(\d+)\s/)[0], 10)
      : 0;

    lastStory = commentsLink;
    const url = await titleElem.getAttribute('href');

    results.push({
      id,
      title,
      score,
      age,
      url,
      commentCount,
      contributor: {
        id: contributor,
        username: contributor,
      },
    });
  }

  if (lastStory) {
    await agent.click(lastStory);
    await agent.waitForLocation('change');
    await agent.waitForElement(agent.document.querySelector('textarea'));
    await agent.click(agent.document.querySelector('textarea'));
    await agent.type('Hackernews!');
    const comments = [...(await agent.document.querySelectorAll('.commtext'))];
    await agent.interact({
      move: comments[comments.length - 1],
    });
  }

  console.log('-- PRINTING extracted results ---------------');
  console.log(results);

  console.log('-------------------------------------');
  console.log('DONE');

  await agent.close();
}

run().catch(error => console.log(error));
