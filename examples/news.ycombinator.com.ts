import SecretAgent from '@secret-agent/full-client';

process.env.SA_SHOW_REPLAY = 'true';

async function run() {
  const browser = await SecretAgent.createBrowser();
  await browser.goto('https://news.ycombinator.com/');
  await browser.waitForAllContentLoaded();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await browser.url);

  const html = await browser.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(html);

  const results = [];

  const stories = await browser.document.querySelectorAll('.athing');
  for (const story of stories) {
    const extraElem = await story.nextElementSibling;

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

    const url = await titleElem.getAttribute('href');

    results.push({
      id,
      title,
      score,
      age,
      url,
      contributor: {
        id: contributor,
        username: contributor,
      },
    });
  }

  console.log('-- PRINTING extracted results ---------------');
  console.log(results);

  console.log('-------------------------------------');
  console.log('DONE');

  await SecretAgent.shutdown();
}

run().catch(error => console.log(error));
