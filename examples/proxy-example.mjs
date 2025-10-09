import Hero from '@ulixee/hero';

// NOTE: You need to start a Ulixee Miner to run this example

(async () => {
  const hero = new Hero({
    upstreamProxyUrl: `socks5://${process.env.PROXY_PASS}@proxy-nl.privateinternetaccess.com:1080`,
    showChrome: true,
    sessionKeepAlive: true,
  });
  await hero.goto('https://whatsmyip.com/');
  await hero.waitForPaintingStable();
  await hero.close();
})().catch(err => console.log('Caught error in script', err));
