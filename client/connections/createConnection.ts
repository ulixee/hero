import Log from '@secret-agent/commons/Logger';
import ICoreConnectionOptions from '../interfaces/ICoreConnectionOptions';
import CoreClientConnection from './CoreClientConnection';
import RemoteCoreConnection from './RemoteCoreConnection';
import LocalCoreConnection from './LocalCoreConnection';

const { log } = Log(module);

export default function createConnection(
  options: ICoreConnectionOptions | CoreClientConnection,
): CoreClientConnection {
  if (options instanceof CoreClientConnection) {
    // NOTE: don't run connect on an instance
    return options;
  }

  let connection: CoreClientConnection;
  if (options.host) {
    connection = new RemoteCoreConnection(options);
  } else {
    if (!LocalCoreConnection.create) {
      throw new Error(
        `You need to install the full "npm i secret-agent" installation to use local connections.

If you meant to connect to a remote host, include the "host" parameter for your connection`,
      );
    }
    connection = LocalCoreConnection.create(options);
  }
  connection.connect().catch(error =>
    log.error('Error connecting to core', {
      error,
      sessionId: null,
    }),
  );
  return connection;
}
