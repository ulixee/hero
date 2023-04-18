import Log from '@ulixee/commons/lib/Logger';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import UlixeeHostsConfig from '@ulixee/commons/config/hosts';
import { WsTransportToCore } from '@ulixee/net';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import ConnectionToHeroCore from './ConnectionToHeroCore';
import CallsiteLocator from '../lib/CallsiteLocator';

const { version } = require('../package.json');

const { log } = Log(module);

export default class ConnectionFactory {
  public static hasLocalCloudPackage = false;

  public static createConnection(
    options: IConnectionToCoreOptions | ConnectionToHeroCore,
    callsiteLocator?: CallsiteLocator,
  ): ConnectionToHeroCore {
    if (options instanceof ConnectionToHeroCore) {
      // NOTE: don't run connect on an instance
      return options;
    }

    let connection: ConnectionToHeroCore;
    if (options.host) {
      const host = Promise.resolve(options.host).then(ConnectionToHeroCore.resolveHost);
      const transport = new WsTransportToCore(host);
      connection = new ConnectionToHeroCore(transport, null, callsiteLocator);
    } else {
      const host = UlixeeHostsConfig.global.getVersionHost(version);

      if (!host && ConnectionFactory.hasLocalCloudPackage) {
        // If Clouds are launched, but none compatible, propose installing @ulixee/cloud locally
        throw new Error(
          `A local Ulixee Cloud is not started. From your project, run:\n\nnpx @ulixee/cloud start`,
        );
      }

      if (host) {
        const transport = new WsTransportToCore(ConnectionToHeroCore.resolveHost(host));
        connection = new ConnectionToHeroCore(transport, { ...options, version }, callsiteLocator);
      } else if (UlixeeHostsConfig.global.hasHosts()) {
        // If Clouds are launched, but none compatible, propose installing @ulixee/cloud locally
        throw new Error(`Your script is using version ${version} of Hero. A compatible Hero Core was not found on localhost. You can fix this by installing and running a local Ulixee Cloud in your project:

npm install --save-dev @ulixee/cloud @ulixee/desktop-core

npx @ulixee/cloud start
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
  require.resolve('@ulixee/cloud');
  ConnectionFactory.hasLocalCloudPackage = true;
} catch (error) {
  /* no-op */
}
