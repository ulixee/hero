import SecretAgent from '@secret-agent/full-client';

process.env.SA_SHOW_REPLAY = 'true';

async function run() {
  const browser = await SecretAgent.createBrowser();
  await browser.goto('https://news.ycombinator.com/');
  await browser.waitForAllContentLoaded();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await browser.url);

  const results = [];

  const stories = await browser.document.querySelectorAll('.athing');
  let lastStory;
  for (const story of stories) {
    await browser.waitForMillis(200);
    const extraElem = await story.nextElementSibling;
    await browser.interact({
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
    await browser.click(lastStory);
    await browser.waitForLocation('change');
    await browser.waitForElement(browser.document.querySelector('textarea'));
    await browser.click(browser.document.querySelector('textarea'));
    await browser.type('Hackernews!');
    const comments = [...(await browser.document.querySelectorAll('.commtext'))];
    await browser.interact({
      move: comments[comments.length - 1],
    });
  }

  console.log('-- PRINTING extracted results ---------------');
  console.log(results);

  console.log('-------------------------------------');
  console.log('DONE');

  await SecretAgent.shutdown();
}

run().catch(error => console.log(error));
