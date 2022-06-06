import Core from '@ulixee/hero-core';
import DefaultHero, { ConnectionToHeroCore, IHeroCreateOptions } from '@ulixee/hero';
import TransportBridge from '@ulixee/net/lib/TransportBridge';

export default class TestHero extends DefaultHero {
  constructor(createOptions: IHeroCreateOptions = {}) {
    const bridge = new TransportBridge();
    Core.addConnection(bridge.transportToClient);
    createOptions.connectionToCore = new ConnectionToHeroCore(bridge.transportToCore);
    super(createOptions);
  }
}
