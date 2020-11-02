import SecretAgentSocketClient from './lib/Client';

(async function run() {
  const client = new SecretAgentSocketClient({ port: 8124 });
  const { SecretAgent } = client;
  const agent = await new SecretAgent();
  console.log('sessionId: ', agent.sessionId);

  await agent.goto('https://news.ycombinator.com');
  const html = await agent.document.documentElement.outerHTML;

  console.log(html);
})().catch(error => {
  console.log(error);
});
