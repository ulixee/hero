// setup must go first
import './lib/SetupAwaitedHandler';
import { BlockedResourceType } from '@secret-agent/core-interfaces/ITabOptions';
import { KeyboardKeys } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import { InteractionCommand, MouseButton } from '@secret-agent/core-interfaces/IInteractions';
import { Node, XPathResult } from '@secret-agent/core-interfaces/AwaitedDom';
import { LocationStatus, LocationTrigger } from '@secret-agent/core-interfaces/Location';
import IAgentCreateOptions from './interfaces/IAgentCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import Handler from './lib/Handler';
import Agent from './lib/Agent';
import RemoteConnectionToCore from './connections/RemoteConnectionToCore';
import ConnectionToCore from './connections/ConnectionToCore';
import ConnectionFactory from './connections/ConnectionFactory';

export default new Agent();

export {
  Handler,
  Agent,
  RemoteConnectionToCore,
  ConnectionToCore,
  ConnectionFactory,
  InteractionCommand,
  MouseButton,
  ResourceType,
  KeyboardKeys,
  BlockedResourceType,
  IAgentCreateOptions,
  IConnectionToCoreOptions,
  Node,
  XPathResult,
  LocationStatus,
  LocationTrigger,
};
