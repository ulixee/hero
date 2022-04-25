import Log from '@ulixee/commons/lib/Logger';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import UlixeeConfig from '@ulixee/commons/config';
import UlixeeServerConfig from '@ulixee/commons/config/servers';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import ConnectionToCore from './ConnectionToCore';
import ConnectionToRemoteCoreServer from './ConnectionToRemoteCoreServer';

const { version } = require('../package.json');

const { log } = Log(module);

export type ICreateConnectionToCoreFn = (options: IConnectionToCoreOptions) => ConnectionToCore;

export default class ConnectionFactory {
  public static hasLocalServerPackage = false;

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
      const serverHost =
        UlixeeConfig.load()?.serverHost ??
        UlixeeConfig.global.serverHost ??
        UlixeeServerConfig.global.getVersionHost(version);

      if (serverHost) {
        connection = new ConnectionToRemoteCoreServer({ ...options, host: serverHost, version });
      } else if (UlixeeServerConfig.global.hasServers()) {
        if (this.hasLocalServerPackage) {
          // If servers are launched, but none compatible, propose installing server locally
          throw new Error(
            `Your Ulixee Server is not started. From your project, run:\n\n./node_modules/.bin/ulixee-start-server`,
          );
        }

        // If servers are launched, but none compatible, propose installing server locally
        throw new Error(`Your script is using version ${version} of Hero. A compatible Ulixee Server was not found on localhost. You can fix this by installing and running server in your project:

npm i --save-dev @ulixee/server @ulixee/apps-chromealive-core

./node_modules/.bin/ulixee-start-server
        `);
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
try {
  require.resolve('@ulixee/server');
  ConnectionFactory.hasLocalServerPackage = true;
} catch (error) {}
