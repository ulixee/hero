const { Agent } = require('@ulixee/hero');

process.env.HERO_SHOW_BROWSER = 'true';

(async () => {
  const url = `https://dataliberationfoundation.org/`;
  console.log('Opened Browser');
  const agent = new Agent();

  await agent.goto(url, 5e3);
  await agent.waitForPaintingStable();

  await agent.waitForMillis(5e3);
  await agent.close();
})();
