const SecretAgent = require('@secret-agent/full-client');

(async () => {
  const agent = await new SecretAgent({
    upstreamProxyUrl: `socks5://raxILwHll:iX4quHWDCDP@iad.socks.ipvanish.com:1080`,
  });
  await agent.goto('https://whatismyipaddress.com/');
  await agent.waitForAllContentLoaded();
  await agent.close();
})().catch(err => console.log('Caught error in script', err));
