import '@ulixee/commons/lib/SourceMapSupport';
import Core from '@ulixee/hero-core';
import DefaultHero, { IHeroCreateOptions } from '@ulixee/hero';
import { CloudNode } from '@ulixee/cloud';
import UlixeeHostsConfig from '@ulixee/commons/config/hosts';

const { version } = require('./package.json');

export * from '@ulixee/hero';
export { Core };

let counter = 0;
export default class Hero extends DefaultHero {
  constructor(createOptions: IHeroCreateOptions = {}) {
    counter += 1;
    if (counter > 1) {
      console.warn(`You've launched multiple instances of Hero using Hero Playgrounds. @ulixee/hero-playgrounds is intended to help you get started with examples, but will try to automatically shut down after the first example is run. 
      
If you're starting to run real production scenarios, you likely want to look into converting to a Client/Core setup: 

https://ulixee.org/docs/hero/advanced-concepts/client-vs-core
`);
    }
    createOptions.connectionToCore = { host: getCoreHost() };
    super(createOptions);
  }
}

async function getCoreHost(): Promise<string> {
  let coreHost = UlixeeHostsConfig.global.getVersionHost(version);

  if (coreHost?.startsWith('localhost')) {
    coreHost = await UlixeeHostsConfig.global.checkLocalVersionHost(version, coreHost);
  }

  // start a cloud if none already started
  if (!coreHost) {
    const cloud = new CloudNode();
    await cloud.listen();
    coreHost = await cloud.address;
    console.log('Started Ulixee Cloud at %s', coreHost);
  } else {
    console.log('Connecting to Ulixee Cloud at %s', coreHost);
  }

  Core.events.once('browser-has-no-open-windows', ({ browser }) => browser.close());
  Core.events.once('all-browsers-closed', () => {
    console.log('Automatically shutting down Hero Core (Browser Closed)');
    return Core.shutdown();
  });
  return coreHost;
}
