import DefaultHero, { IConnectionToCoreOptions } from '@ulixee/hero';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import ConnectionToLocalCore from './ConnectionToLocalCore';

export default class Hero extends DefaultHero {
  public static createConnectionToCore(options: IConnectionToCoreOptions) {
    const connection = new ConnectionToLocalCore({ ...options });
    ShutdownHandler.register(() => connection.disconnect());
    return connection;
  }
}
