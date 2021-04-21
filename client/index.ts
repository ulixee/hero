// setup must go first
import './lib/SetupAwaitedHandler';
import { BlockedResourceType } from '@secret-agent/interfaces/ITabOptions';
import { KeyboardKeys } from '@secret-agent/interfaces/IKeyboardLayoutUS';
import ResourceType from '@secret-agent/interfaces/ResourceType';
import { InteractionCommand, MouseButton } from '@secret-agent/interfaces/IInteractions';
import { Node, XPathResult } from '@secret-agent/interfaces/AwaitedDom';
import { LocationStatus, LocationTrigger } from '@secret-agent/interfaces/Location';
import IAgentCreateOptions from './interfaces/IAgentCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import Handler from './lib/Handler';
import Agent from './lib/Agent';
import type FrameEnvironment from './lib/FrameEnvironment';
import type Tab from './lib/Tab';
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
  FrameEnvironment,
  Tab,
  XPathResult,
  LocationStatus,
  LocationTrigger,
};
