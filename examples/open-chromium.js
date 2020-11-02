const SecretAgent = require('@secret-agent/full-client');

process.env.SHOW_BROWSER = 'true';
process.env.SA_REPLAY_DEBUG = '1';

(async () => {
  const agent = await new SecretAgent();

  const url = `https://dataliberationfoundation.org/`;
  console.log('Opened Browser');

  await browser.goto(url);
  await browser.waitForAllContentLoaded();

  await browser.waitForMillis(5e3);
  await browser.close();
})();
