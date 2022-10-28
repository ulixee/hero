import Core from '@ulixee/hero-core';
import DefaultHero, { ConnectionToHeroCore, IHeroCreateOptions } from '@ulixee/hero';
import TransportBridge from '@ulixee/net/lib/TransportBridge';

export default class TestHero extends DefaultHero {
  constructor(createOptions: IHeroCreateOptions = {}) {
    createOptions.connectionToCore = TestHero.getDirectConnectionToCore();
    super(createOptions);
  }

  public static getDirectConnectionToCore(): ConnectionToHeroCore {
    const bridge = new TransportBridge();
    Core.addConnection(bridge.transportToClient);
    return new ConnectionToHeroCore(bridge.transportToCore);
  }
}
