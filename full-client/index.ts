import 'source-map-support/register';
import { Handler, ICoreConnectionOptions } from '@secret-agent/client';
import Agent from '@secret-agent/client/lib/Agent';
import CoreClient from '@secret-agent/client/lib/CoreClient';
import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import CoreClientConnection from '@secret-agent/client/lib/CoreClientConnection';
import Core from '@secret-agent/core';
import CoreServerConnection from '@secret-agent/core/lib/CoreServerConnection';

export { Handler, Agent };

class LocalCoreConnection extends CoreClientConnection {
  constructor(
    options: ICoreConnectionOptions,
    readonly coreServerConnection: CoreServerConnection,
  ) {
    super(options);
    coreServerConnection.on('message', payload => this.onMessage(payload));
  }

  sendRequest(payload: ICoreRequestPayload): void | Promise<void> {
    return this.coreServerConnection.handleRequest(payload);
  }
}

CoreClient.LocalCoreConnectionCreator = (options: ICoreConnectionOptions) => {
  const coreServerConnection = Core.addConnection();
  return new LocalCoreConnection(options, coreServerConnection);
};

const serverConnection = Core.addConnection();
const connection = new LocalCoreConnection({}, serverConnection);
const client = new CoreClient(connection);

const agent = new Agent(async () => {
  await connection.connect();
  return client;
});
export default agent;
