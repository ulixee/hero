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
import Handler from './lib/Handler';
import Hero from './lib/Hero';
import type FrameEnvironment from './lib/FrameEnvironment';
import type Tab from './lib/Tab';
import RemoteConnectionToCore from './connections/RemoteConnectionToCore';
import ConnectionToCore from './connections/ConnectionToCore';
import ConnectionFactory from './connections/ConnectionFactory';
import { Observable } from './lib/ObjectObserver';
import { readCommandLineArgs } from './lib/Input';

const input = readCommandLineArgs();

export default new Hero({ input });

export {
  Observable,
  Handler,
  Hero,
  RemoteConnectionToCore,
  ConnectionToCore,
  ConnectionFactory,
  InteractionCommand,
  MouseButton,
  ResourceType,
  KeyboardKeys,
  BlockedResourceType,
  IHeroCreateOptions,
  IConnectionToCoreOptions,
  Node,
  FrameEnvironment,
  Tab,
  XPathResult,
  LocationStatus,
  LocationTrigger,
};
