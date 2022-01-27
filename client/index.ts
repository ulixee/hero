// setup must go first
import './lib/SetupAwaitedHandler';
import type { ISuperDocument, ISuperElement, ISuperNode, ISuperNodeList, ISuperHTMLCollection, ISuperText, ISuperStyleSheet, ISuperHTMLElement } from "awaited-dom/base/interfaces/super";
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import { KeyboardKey } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import IResourceType, { ResourceType } from '@ulixee/hero-interfaces/IResourceType';
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
  ResourceType,
  KeyboardKey,
  BlockedResourceType,
  Node,
  FrameEnvironment,
  Tab,
  XPathResult,
  LocationStatus,
  LocationTrigger,
  IHeroCreateOptions,
  IConnectionToCoreOptions,
  ISuperDocument,
  ISuperElement,
  ISuperNode,
  ISuperNodeList,
  ISuperHTMLCollection,
  ISuperText,
  ISuperStyleSheet,
  ISuperHTMLElement,
};
