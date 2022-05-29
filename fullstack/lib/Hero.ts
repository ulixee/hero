import DefaultHero, { ConnectionToHeroCore, IConnectionToCoreOptions } from '@ulixee/hero';
import TransportBridge from '@ulixee/net/lib/TransportBridge';
import { Core } from '../index';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';

export const Settings = {
  shouldSerializeDirectConnection: false,
  shouldAutoShutdown: process.env.NODE_ENV !== 'test',
};

let isFirstInit = true;
export default class Hero extends DefaultHero {
  static override createConnectionToCore(options: IConnectionToCoreOptions): ConnectionToHeroCore {
    const connection = createDirectConnectionToCore(options);

    if (Settings.shouldAutoShutdown && isFirstInit) {
      Core.events.once('browser-has-no-open-windows', ({ browser }) => browser.close());
      Core.events.once('all-browsers-closed', () => Core.shutdown());
    }
    isFirstInit = false;
    ShutdownHandler.register(() => connection.disconnect());
    return connection;
  }
}

export function createDirectConnectionToCore(
  options: IConnectionToCoreOptions = {},
): ConnectionToHeroCore {
  const bridge = new TransportBridge(Settings.shouldSerializeDirectConnection, 'FULLSTACK');
  Core.addConnection(bridge.transportToClient);
  return new ConnectionToHeroCore(bridge.transportToCore, { ...options });
}
