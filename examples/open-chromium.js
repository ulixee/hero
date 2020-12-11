import SecretAgent from '@secret-agent/full-client';

(async () => {
  const agent = await new SecretAgent();

  const url = `https://dataliberationfoundation.org/`;
  console.log('Opened Browser');

  await agent.goto(url);
  await agent.waitForAllContentLoaded();

  await agent.waitForMillis(5e3);
  await agent.close();
})();
