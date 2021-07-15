import Log from '@secret-agent/commons/Logger';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import ConnectionToCore from './ConnectionToCore';
import RemoteConnectionToCore from './RemoteConnectionToCore';

const { log } = Log(module);

export default class ConnectionFactory {
  public static createLocalConnection?: (options: IConnectionToCoreOptions) => ConnectionToCore;

  public static createConnection(
    options: IConnectionToCoreOptions | ConnectionToCore,
  ): ConnectionToCore {
    if (options instanceof ConnectionToCore) {
      // NOTE: don't run connect on an instance
      return options;
    }

    let connection: ConnectionToCore;
    if (options.host) {
      connection = new RemoteConnectionToCore(options);
    } else {
      if (!this.createLocalConnection) {
        throw new Error(
          `You need to install the full "npm i secret-agent" installation to use local connections.

If you meant to connect to a remote host, include the "host" parameter for your connection`,
        );
      }
      connection = this.createLocalConnection(options);
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

    connection.connect().then(onError).catch(onError);

    return connection;
  }
}
