import agent from 'secret-agent';

async function run() {
  await agent.goto('https://example.org/');
  await agent.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await agent.url);

  const html = await agent.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(html);
  agent.output.html = html;
  agent.output.title = await agent.document.title;
  agent.output.intro = await agent.document.querySelector('p').textContent;

  console.log('-------------------------------------');

  await agent.close();

  console.log('OUTPUT from https://example.org', agent.output);
}

run().catch(error => console.log(error));
