import 'source-map-support/register';
import agent, {
  Handler,
  Agent,
  IAgentCreateOptions,
  ICoreConnectionOptions,
  RemoteCoreConnection,
  LocalCoreConnection,
} from '@secret-agent/client';
import Core from '@secret-agent/core';

LocalCoreConnection.create = (options: ICoreConnectionOptions) => {
  const coreServerConnection = Core.addConnection();
  return new LocalCoreConnection(options, coreServerConnection);
};

export { IAgentCreateOptions, ICoreConnectionOptions, Handler, Agent, RemoteCoreConnection };
export default agent;
