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
} from 'awaited-dom/base/interfaces/super';
import {
  IElement,
  IHTMLCollection,
  IHTMLElement,
  INode,
  INodeList,
} from 'awaited-dom/base/interfaces/official';
import { BlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import { KeyboardKey } from '@unblocked-web/specifications/agent/interact/IKeyboardLayoutUS';
import IResourceType, { ResourceType } from '@unblocked-web/specifications/agent/net/IResourceType';
import { InteractionCommand, MouseButton,  } from '@unblocked-web/specifications/agent/interact/IInteractions';
import { Node, XPathResult } from '@ulixee/hero-interfaces/AwaitedDom';
import { LoadStatus, LocationStatus, LocationTrigger } from '@unblocked-web/specifications/agent/browser/Location';
import IHeroCreateOptions from './interfaces/IHeroCreateOptions';
import IHeroExtractorCreateOptions from './interfaces/IHeroExtractorCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import { Command } from './interfaces/IInteractions';
import { Hero, HeroExtractor, FrameEnvironment, Tab, Resource, WebsocketResource } from './lib/extendables';
import ConnectionToHeroCore from './connections/ConnectionToHeroCore';

export default Hero;

export {
  HeroExtractor,
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
  IHeroExtractorCreateOptions,
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
