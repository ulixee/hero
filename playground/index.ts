import '@ulixee/commons/lib/SourceMapSupport';
import DefaultHero, { ConnectionToHeroCore, IHeroCreateOptions } from '@ulixee/hero';
import Core from '@ulixee/hero-core';
import TransportBridge from '@ulixee/net/lib/TransportBridge';

export * from '@ulixee/hero';
export { Core };

// eslint-disable-next-line @typescript-eslint/naming-convention
let _heroCore: Core;
function initCore(): Core {
  if (_heroCore) return _heroCore;
  Core.events.once('browser-has-no-open-windows', ({ browser }) => browser.close());
  Core.events.once('all-browsers-closed', () => {
    // eslint-disable-next-line no-console
    console.log('Automatically shutting down Hero Core (Browser Closed)');
    return Core.shutdown();
  });
  _heroCore = new Core();
  return _heroCore;
}

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
    const transportBridge = new TransportBridge();
    createOptions.connectionToCore = new ConnectionToHeroCore(transportBridge.transportToCore);
    initCore().addConnection(transportBridge.transportToClient);
    super(createOptions);
  }
}
