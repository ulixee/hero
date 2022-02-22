import Log from '@ulixee/commons/lib/Logger';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import UlixeeConfig from '@ulixee/commons/config';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import ConnectionToCore from './ConnectionToCore';
import ConnectionToRemoteCoreServer from './ConnectionToRemoteCoreServer';

const { log } = Log(module);

export type ICreateConnectionToCoreFn = (options: IConnectionToCoreOptions) => ConnectionToCore;

export default class ConnectionFactory {
  public static createConnection(
    options: IConnectionToCoreOptions | ConnectionToCore,
    overrideCreateConnectionToCoreFn?: ICreateConnectionToCoreFn,
  ): ConnectionToCore {
    if (options instanceof ConnectionToCore) {
      // NOTE: don't run connect on an instance
      return options;
    }

    let connection: ConnectionToCore;
    if (overrideCreateConnectionToCoreFn) {
      connection = overrideCreateConnectionToCoreFn(options);
    } else if (options.host) {
      connection = new ConnectionToRemoteCoreServer(options);
    } else {
      const serverHost = UlixeeConfig.load()?.serverHost ?? UlixeeConfig.global.serverHost;
      if (serverHost) {
        connection = new ConnectionToRemoteCoreServer({ ...options, host: serverHost });
      }
    }

    if (!connection) {
      throw new Error(
        'Hero Core could not be found locally' +
          '\n' +
          'If you meant to connect to a remote host, include the "host" parameter for your connection',
      );
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const onError = (error: Error) => {
      if (error) {
        log.error('Error connecting to core', {
          error,
          sessionId: null,
        });
      }
    };

    connection.connect(true).then(onError).catch(onError);
    ShutdownHandler.register(() => connection.disconnect());

    return connection;
  }
}
