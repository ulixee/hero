const agent = require('secret-agent');

(async () => {
  const url = `https://dataliberationfoundation.org/`;

  await agent.goto(url, 5e3);
  await agent.waitForPaintingStable();

  await agent.close();
})();
