// setup must go first
import './lib/SetupAwaitedHandler';
import './lib/DomExtender'
import type {
  ISuperDocument,
  ISuperElement,
  ISuperNode,
  ISuperNodeList,
  ISuperHTMLCollection,
  ISuperText,
  ISuperStyleSheet,
  ISuperHTMLElement,
} from '@ulixee/awaited-dom/base/interfaces/super';
import {
  IElement,
  IHTMLCollection,
  IHTMLElement,
  INode,
  INodeList,
} from '@ulixee/awaited-dom/base/interfaces/official';
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import { KeyboardKey } from '@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS';
import IResourceType, { ResourceType } from '@ulixee/unblocked-specification/agent/net/IResourceType';
import { InteractionCommand, MouseButton,  } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import { Node, XPathResult } from '@ulixee/hero-interfaces/AwaitedDom';
import { LoadStatus, LocationStatus, LocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import IHeroCreateOptions from './interfaces/IHeroCreateOptions';
import IHeroReplayCreateOptions from './interfaces/IHeroReplayCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import { Command } from './interfaces/IInteractions';
import { Hero, HeroReplay, FrameEnvironment, Tab, Resource, WebsocketResource } from './lib/extendables';
import ConnectionToHeroCore from './connections/ConnectionToHeroCore';
import DetachedElement from './lib/DetachedElement';

export default Hero;

export {
  HeroReplay,
  DetachedElement,
  Command,
  ConnectionToHeroCore,
  InteractionCommand,
  MouseButton,
  IResourceType,
  ResourceType,
  KeyboardKey,
  BlockedResourceType,
  Node,
  FrameEnvironment,
  Tab,
  Resource,
  WebsocketResource,
  XPathResult,
  LoadStatus,
  LocationStatus,
  LocationTrigger,
  IHeroCreateOptions,
  IHeroReplayCreateOptions,
  IConnectionToCoreOptions,
  ISuperElement,
  ISuperNode,
  ISuperHTMLElement,
  ISuperNodeList,
  ISuperHTMLCollection,
  ISuperStyleSheet,
  ISuperDocument,
  ISuperText,
  IElement,
  INode,
  IHTMLElement,
  INodeList,
  IHTMLCollection,
};
