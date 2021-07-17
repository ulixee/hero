import Hero, { Observable } from '@ulixee/hero';

// process.env.HERO_SHOW_BROWSER = 'true';

async function run() {
  const hero = new Hero({ userAgent: '~ chrome = 88', showReplay: true });
  await hero.goto('https://news.ycombinator.com/');
  await hero.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await hero.url);

  const stories = await hero.document.querySelectorAll('.athing');
  let lastStory;
  for (const story of stories) {
    await hero.waitForMillis(200);
    const extraElem = await story.nextElementSibling;
    await hero.interact({
      move: story,
    });
    const record = Observable({} as any);
    hero.output.push(record);

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
    await hero.click(lastStory);
    await hero.waitForLocation('change');
    await hero.waitForElement(hero.document.querySelector('textarea'));
    await hero.click(hero.document.querySelector('textarea'));
    await hero.type('Hackernews!');
    const comments = [...(await hero.document.querySelectorAll('.commtext'))];
    await hero.interact({
      move: comments[comments.length - 1],
    });
  }

  console.log('-- PRINTING extracted results ---------------');
  console.log(hero.output);

  console.log('-------------------------------------');
  console.log('DONE');

  await hero.close();
}

run().catch(error => console.log(error));
