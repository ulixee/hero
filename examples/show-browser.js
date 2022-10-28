// NOTE: You need to start a Ulixee Miner to run this example

const Hero = require('@ulixee/hero');

//process.env.ULX_SHOW_CHROME = 'true';

(async () => {
  const url = `https://dataliberationfoundation.org/`;
  console.log('Opened Browser');
  const hero = new Hero({ showChromeInteractions: true, showChrome: true });

  await hero.goto(url, 5e3);
  await hero.waitForPaintingStable();

  await hero.waitForMillis(5e3);
  await hero.close();
})();
