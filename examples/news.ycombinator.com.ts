import agent, { Observable } from 'secret-agent';

// process.env.SA_SHOW_BROWSER = 'true';

async function run() {
  await agent.configure({ userAgent: '~ chrome = 88' });
  await agent.goto('https://news.ycombinator.com/');
  await agent.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await agent.url);

  const stories = await agent.document.querySelectorAll('.athing');
  let lastStory;
  for (const story of stories) {
    await agent.waitForMillis(200);
    const extraElem = await story.nextElementSibling;
    await agent.interact({
      move: story,
    });
    const record = Observable({} as any);
    agent.output.push(record);

    const titleElem = await story.querySelector('a.storylink');

    record.score = parseInt(
      await extraElem.querySelector('.score').textContent.catch(() => '0'),
      10,
    );
    record.id = await story.getAttribute('id');
    record.age = await extraElem.querySelector('.age a').textContent;
    record.title = await titleElem.textContent;
    const contributor = await extraElem.querySelector('.hnuser').textContent.catch(() => '');
    record.contributor = { id: contributor, username: contributor };

    const links = [...(await extraElem.querySelectorAll('.subtext > a'))];
    const commentsLink = links[links.length - 1];
    const commentText = await commentsLink.textContent;
    record.commentCount = commentText.includes('comment')
      ? parseInt(commentText.trim().match(/(\d+)\s/)[0], 10)
      : 0;

    lastStory = commentsLink;
    record.url = await titleElem.getAttribute('href');
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
  console.log(agent.output);

  console.log('-------------------------------------');
  console.log('DONE');

  await agent.close();
}

run().catch(error => console.log(error));
