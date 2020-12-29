// setup must go first
import './lib/SetupAwaitedHandler';

import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import IAgentCreateOptions from './interfaces/IAgentCreateOptions';
import ICoreConnectionOptions from './interfaces/ICoreConnectionOptions';
import Handler from './lib/Handler';
import Agent from './lib/Agent';
import RemoteCoreConnection from './lib/RemoteCoreConnection';

export {
  LocationStatus,
  IAgentCreateOptions,
  ICoreConnectionOptions,
  Handler,
  Agent,
  RemoteCoreConnection,
};
