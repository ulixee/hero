const SecretAgent = require('@secret-agent/full-client');

(async () => {
  const browser = await SecretAgent.createBrowser();
  await browser.goto('https://example.org');
  await browser.waitForAllContentLoaded();
  const title = await browser.document.title;
  const intro = await browser.document.querySelector('p').textContent;
  console.log('Loaded https://example.org', {
    title,
    intro,
  });
  await browser.close();
})();
