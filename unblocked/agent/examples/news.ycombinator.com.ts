import { Agent } from '@ulixee/unblocked-agent';
import { IJsPath } from '@ulixee/js-path';

const Chrome113 = require('@ulixee/chrome-113-0');

async function run() {
  const agent = new Agent({
    browserEngine: new Chrome113(),
    options: {
      showChrome: true,
    },
  });
  agent.hook({
    onNewBrowser(browser) {
      browser.engine.launchArguments.push('--no-startup-window', '--disable-background-networking');
    },
  });
  await agent.open();

  const page = await agent.newPage();
  await page.goto('https://news.ycombinator.com/');
  await page.waitForLoad('PaintingStable');

  console.log('\n-- PRINTING location.href ---------');
  console.log(page.mainFrame.url);

  const storyNodeIds = await page.evaluate<number[]>(
    `(() => {
   const nodeIds = [];
    for (const story of document.querySelectorAll('.athing')) {
      const nodeId = NodeTracker.watchNode(story);
      nodeIds.push(nodeId);
    }
    return nodeIds;
  })()`,
    true,
  );
  interface IRecord {
    nodeId: number;
    id: string;
    score: number;
    title: string;
    age: string;
    commentCount: number;
    url: string;
    contributor: { id: string; username: string };
  }
  const stories: IRecord[] = [];
  for (const storyNodeId of storyNodeIds) {
    const record = await page.evaluate<IRecord>(
      `(() => {
      const nodeId = ${storyNodeId};
      const story = NodeTracker.getWatchedNodeWithId(nodeId);
      const extraElem =  story.nextElementSibling;
      const record = { nodeId };
      const titleElem = story.querySelector('a.storylink') || story.querySelector('a.titlelink');
      const scoreElem = extraElem.querySelector('.score');
      const contributorElem = extraElem.querySelector('.hnuser');
      
      record.score = scoreElem ? parseInt(scoreElem.textContent,10) : 0;
      record.id = story.getAttribute('id');
      record.age = extraElem.querySelector('.age a').textContent;
      record.title = titleElem ? titleElem.textContent : '';
      const contributor = contributorElem ? contributorElem.textContent : '';
      record.contributor = { id: contributor, username: contributor };
  
      const links = [...extraElem.querySelectorAll('.subtext > a')];
      const commentsLink = links[links.length - 1];
      if (commentsLink) record.comments = parseInt(commentsLink.textContent,10);
  
      if (titleElem) record.url = titleElem.getAttribute('href');
      return record;
  })()`,
      true,
    );
    stories.push(record);
  }
  console.log('-- READ stories ---------------');
  const output = [];

  for (const story of stories) {
    await wait(200);
    await page.interact([
      {
        command: 'move',
        mousePosition: [story.nodeId],
      },
    ]);
    output.push(story);
  }
  console.log('-- MOVED MOUSE OVER EACH story ---------------');

  const lastId = storyNodeIds[storyNodeIds.length - 1];
  const lastStoryComment = await page.mainFrame.evaluate<IJsPath>(`(() => {
    const nodeId = ${lastId};
    const story = NodeTracker.getWatchedNodeWithId(nodeId);
    const extraElem =  story.nextElementSibling;
    const links = [...extraElem.querySelectorAll('.subtext > a')];
    const commentsLink = links[links.length - 1];
      
    if (commentsLink) return [NodeTracker.watchNode(commentsLink)];
  })()`);

  if (lastStoryComment) {
    console.log(`-- GOT LAST COMMENT LINK [${lastStoryComment.toString()}]---------------`);
    await page.click(lastStoryComment);
    await page.mainFrame.waitForLocation('change', { timeoutMs: 10e3 });
    await page.mainFrame.waitForLoad({ loadStatus: 'AllContentLoaded' });
    const textAreaNodeId = await page.mainFrame.jsPath.getNodePointerId([
      'document',
      ['querySelector', 'textarea'],
    ]);

    while (true) {
      const visibility = await page.mainFrame.jsPath.getNodeVisibility([textAreaNodeId]);
      if (visibility.isVisible) break;
      await wait(100);
    }
    await page.click([textAreaNodeId]);
    await page.type('Hackernews!');

    const lastCommentId = await page.evaluate<number>(
      `(() => {
    const lastComment = Array.from(document.querySelectorAll('.commtext')).slice(-1).pop()
    return NodeTracker.watchNode(lastComment);
    })()`,
      true,
    );
    await page.interact([
      {
        command: 'move',
        mousePosition: [lastCommentId],
      },
    ]);
  }

  console.log('-- PRINTING extracted results ---------------');
  console.log(output);

  console.log('-------------------------------------');
  console.log('DONE');

  await agent.close();
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run().catch(error => console.log(error));
