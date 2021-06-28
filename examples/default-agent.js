const agent = require('secret-agent');

(async () => {
  // configure input.url by running as node default-agent.js --input.url="https://ulixee.org"
  const url = agent.input.url ?? `https://dataliberationfoundation.org/`;

  const start = new Date();

  await agent.goto(url, 5e3);
  await agent.waitForPaintingStable();

  agent.output = {
    url,
    start,
    end: new Date(),
  };

  await agent.close();
})();
