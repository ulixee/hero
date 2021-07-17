import DefaultHero, { IConnectionToCoreOptions } from '@ulixee/hero';
import ShutdownHandler from '@ulixee/commons/ShutdownHandler';
import LocalConnectionToCore from './LocalConnectionToCore';

export default class Hero extends DefaultHero {
  public static createConnectionToCore(options: IConnectionToCoreOptions) {
    const connection = new LocalConnectionToCore({ ...options });
    ShutdownHandler.register(() => connection.disconnect());
    return connection;
  }
}
