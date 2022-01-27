import DefaultHero, { IConnectionToCoreOptions } from '@ulixee/hero';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import ConnectionToCore from '@ulixee/hero/connections/ConnectionToCore';
import IHeroCreateOptions from '@ulixee/hero/interfaces/IHeroCreateOptions';
import ConnectionToLocalCore from './ConnectionToLocalCore';

export default class Hero extends DefaultHero {
  constructor(options: IHeroCreateOptions = {}) {
    super(options);
  }

  public static createConnectionToCore(options: IConnectionToCoreOptions): ConnectionToCore {
    const connection = new ConnectionToLocalCore({ ...options });
    ShutdownHandler.register(() => connection.disconnect());
    return connection;
  }
}
