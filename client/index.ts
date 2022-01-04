// setup must go first
import './lib/SetupAwaitedHandler';
import { ISuperElement, ISuperNode } from "awaited-dom/base/interfaces/super";
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import { KeyboardKeys } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import IResourceType, { ResourceTypes } from '@ulixee/hero-interfaces/IResourceType';
import { InteractionCommand, MouseButton } from '@ulixee/hero-interfaces/IInteractions';
import { Node, XPathResult } from '@ulixee/hero-interfaces/AwaitedDom';
import { LocationStatus, LocationTrigger } from '@ulixee/hero-interfaces/Location';
import IHeroCreateOptions from './interfaces/IHeroCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import { Hero, FrameEnvironment, Tab } from './lib/extendables';
import ConnectionToRemoteCoreServer from './connections/ConnectionToRemoteCoreServer';
import ConnectionToCore from './connections/ConnectionToCore';

export default Hero;

export {
  ConnectionToRemoteCoreServer,
  ConnectionToCore,
  InteractionCommand,
  MouseButton,
  IResourceType,
  ResourceTypes,
  KeyboardKeys,
  BlockedResourceType,
  Node,
  FrameEnvironment,
  Tab,
  XPathResult,
  LocationStatus,
  LocationTrigger,
  IHeroCreateOptions,
  IConnectionToCoreOptions,
  ISuperElement,
  ISuperNode,
};
