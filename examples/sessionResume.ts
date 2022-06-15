// NOTE: You need to start a Ulixee Server to run this example

import Hero from '@ulixee/hero';
import * as Fs from 'fs';

const sessionIdPath = `${__dirname}/previousSession.txt`;
const resumeSessionId = Fs.existsSync(sessionIdPath)
  ? Fs.readFileSync(sessionIdPath, 'utf8')
  : undefined;

(async () => {
  const hero = new Hero({
    showChromeInteractions: true, // disable to remove mouse movements and node highlights (can be detected by page!)
    showChrome: true,
    sessionKeepAlive: true,
    sessionResume: {
      startLocation: 'currentLocation', // 'currentLocation | pageStart', // default: currentLocation
      sessionId: resumeSessionId,
    },
  });
  const sessionId = await hero.sessionId;
  Fs.writeFileSync(sessionIdPath, sessionId);
  await hero.goto('https://ulixee.org');
  await hero.waitForPaintingStable();

  await hero.click(hero.document.querySelector('h1'));

  await hero.click(hero.document.querySelector('.search-form  input'));

  // Uncomment one by one to see changes load
  // await hero.type('flightss');
  //
  // await hero.interact({ click: hero.document.querySelectorAll('.datasets .description')[4] });
  //
  // await hero.waitForLocation('change');
  // await hero.waitForPaintingStable();
  //
  // await hero.interact({ click: hero.document.querySelector('.related-datasets a') });
  //
  // await hero.click(hero.document.querySelector('a[href="/pricing"]'));

  await hero.close();
})();
