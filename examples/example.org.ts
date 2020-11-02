import SecretAgent from '@secret-agent/full-client';

async function run() {
  const agent = await new SecretAgent({ sessionName: 'example.org' });
  await agent.goto('https://example.org/');
  await agent.waitForAllContentLoaded();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await agent.url);

  const html = await agent.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(html);

  console.log('-------------------------------------');
  console.log('DONE');

  await SecretAgent.shutdown();
}

run().catch(error => console.log(error));
