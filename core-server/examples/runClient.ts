import SecretAgentSocketClient from './lib/Client';

(async function run() {
  const client = new SecretAgentSocketClient({ port: 8124 });
  const { SecretAgent } = client;
  const browser = await SecretAgent.createBrowser();
  console.log('sessionId: ', browser.sessionId);

  await browser.goto('https://news.ycombinator.com');
  const html = await browser.document.documentElement.outerHTML;

  console.log(html);
})().catch(error => {
  console.log(error);
});
