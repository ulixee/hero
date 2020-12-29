// setup must go first
import './lib/SetupAwaitedHandler';

import IAgentCreateOptions from './interfaces/IAgentCreateOptions';
import ICoreConnectionOptions from './interfaces/ICoreConnectionOptions';
import Handler from './lib/Handler';
import Agent from './lib/Agent';
import RemoteCoreConnection from './connections/RemoteCoreConnection';
import LocalCoreConnection from './connections/LocalCoreConnection';

export default new Agent();

export {
  IAgentCreateOptions,
  ICoreConnectionOptions,
  Handler,
  Agent,
  RemoteCoreConnection,
  LocalCoreConnection,
};
