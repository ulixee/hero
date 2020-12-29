import agent from '@secret-agent/full-client';

(async () => {
  const url = `https://dataliberationfoundation.org/`;
  console.log('Opened Browser');

  await agent.goto(url);
  await agent.waitForAllContentLoaded();

  await agent.waitForMillis(5e3);
  await agent.close();
})();
