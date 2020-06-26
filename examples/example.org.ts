import SecretAgent from '@secret-agent/full-client';

async function run() {
  const browser = await SecretAgent.createBrowser({ sessionName: 'example.org' });
  await browser.goto('https://example.org/');
  await browser.waitForAllContentLoaded();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await browser.url);

  const html = await browser.document.documentElement.outerHTML;
  console.log('-- PRINTING outerHTML ---------------');
  console.log(html);

  console.log('-------------------------------------');
  console.log('DONE');

  await SecretAgent.shutdown();
}

run().catch(error => console.log(error));
