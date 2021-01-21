import agent from '@secret-agent/full-client';

process.env.SHOW_BROWSER = 'true';

(async () => {
  const url = `https://dataliberationfoundation.org/`;
  console.log('Opened Browser');

  await agent.goto(url);
  await agent.waitForPaintingStable();

  await agent.waitForMillis(5e3);
  await agent.close();
})();
