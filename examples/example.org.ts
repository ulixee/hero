import agent from '@secret-agent/full-client';

async function run() {
  await agent.goto('https://example.org/');
  await agent.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await agent.url);

  const html = await agent.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(html);

  console.log('-------------------------------------');
  console.log('DONE');

  await agent.close();
}

run().catch(error => console.log(error));
