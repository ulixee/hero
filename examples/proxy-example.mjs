import agent from '@secret-agent/full-client';

(async () => {
  await agent.configure({
    upstreamProxyUrl: `socks5://${process.env.PROXY_PASS}@proxy-nl.privateinternetaccess.com:1080`,
  });
  await agent.goto('https://whatsmyip.com/');
  await agent.waitForAllContentLoaded();
  await agent.close();
})().catch(err => console.log('Caught error in script', err));
