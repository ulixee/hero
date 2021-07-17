// setup must go first
import './lib/SetupAwaitedHandler';
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import { KeyboardKeys } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import ResourceType from '@ulixee/hero-interfaces/ResourceType';
import { InteractionCommand, MouseButton } from '@ulixee/hero-interfaces/IInteractions';
import { Node, XPathResult } from '@ulixee/hero-interfaces/AwaitedDom';
import { LocationStatus, LocationTrigger } from '@ulixee/hero-interfaces/Location';
import IHeroCreateOptions from './interfaces/IHeroCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import Hero from './lib/Hero';
import type Tab from './lib/Tab';
import type FrameEnvironment from './lib/FrameEnvironment';
import RemoteServerConnectionToCore from './connections/RemoteServerConnectionToCore';
import ConnectionToCore from './connections/ConnectionToCore';
import { Observable } from './lib/ObjectObserver';

export default Hero;

export {
  Observable,
  RemoteServerConnectionToCore,
  ConnectionToCore,
  InteractionCommand,
  MouseButton,
  ResourceType,
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
};
