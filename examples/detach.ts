import Hero, { LocationStatus } from '@ulixee/hero';
import * as Fs from 'fs';

/**
 * The first run of this will result in a script taking 60+ seconds.
 *
 * Subsequent runs will "learn" the queries that ran against the frozenTab and run significantly faster.
 */
const sessionIdPath = `${__dirname}/detached.txt`;
const resumeSessionId = Fs.existsSync(sessionIdPath)
  ? Fs.readFileSync(sessionIdPath, 'utf8')
  : undefined;

async function run() {
  console.time('Detach');
  const hero = new Hero({
    showBrowserInteractions: true, // disable to remove mouse movements and node highlights (can be detected by page!)
    showBrowser: true,
    sessionKeepAlive: true,
    sessionResume: {
      startLocation: 'currentLocation', // 'currentLocation | pageStart', // default: currentLocation
      sessionId: resumeSessionId,
    },
    allowManualBrowserInteraction: true, // enables mouse/keyboard input in headed browser
    connectionToCore: {
      host: `ws://localhost:1337`, // NOTE: you need to start your own Ulixee server
    },
  });
  const sessionId = await hero.sessionId;
  Fs.writeFileSync(sessionIdPath, sessionId);
  await hero.goto('https://chromium.googlesource.com/chromium/src/+refs');
  await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  await hero.waitForPaintingStable();

  console.timeLog('Detach', 'got sync result');
  const frozenTab = await hero.detach(hero.activeTab);
  console.timeLog('Detach', 'detached');
  const { document } = frozenTab;
  console.log(document);

  const wrapperElements = await document.querySelectorAll('.RefList');
  console.log(wrapperElements);
  console.timeLog('Detach', 'wrapped list');
  const versions = [];
  for (const elem of wrapperElements) {
    console.log(elem);
    const innerText = await elem.querySelector('.RefList-title').innerText;
    if (innerText === 'Tags') {
      console.timeLog('Detach', 'found tags');
      const aElems = await elem.querySelectorAll('ul.RefList-items li a');
      console.timeLog('Detach', 'loaded tag elems');

      for (const aElem of aElems) {
        const version = await aElem.innerText;
        versions.push(version);
      }

      console.timeLog('Detach', 'looped through versions');
      break;
    }
  }
  console.log(versions.length);
  console.timeEnd('Detach');
  await hero.close();
}

run().catch(error => console.log(error));
