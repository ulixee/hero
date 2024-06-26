import Core from '@ulixee/hero-core';
import DefaultHero, { ConnectionToHeroCore, IHeroCreateOptions } from '@ulixee/hero';
import TransportBridge from '@ulixee/net/lib/TransportBridge';

let core: Core;
export default class TestHero extends DefaultHero {
  constructor(createOptions: IHeroCreateOptions = {}) {
    createOptions.connectionToCore ??= TestHero.getDirectConnectionToCore();
    super(createOptions);
  }

  public static getDirectConnectionToCore(): ConnectionToHeroCore {
    const bridge = new TransportBridge();
    core ??= new Core();
    core.addConnection(bridge.transportToClient);
    return new ConnectionToHeroCore(bridge.transportToCore);
  }
}
