// setup must go first
import './lib/SetupAwaitedHandler';
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
import IHeroReplayCreateOptions from './interfaces/IHeroReplayCreateOptions';
import IConnectionToCoreOptions from './interfaces/IConnectionToCoreOptions';
import { Command } from './interfaces/IInteractions';
import { Hero, HeroReplay, FrameEnvironment, Tab, Resource, WebsocketResource } from './lib/extendables';
import ConnectionToHeroCore from './connections/ConnectionToHeroCore';
import DetachedDOM from './lib/DetachedDOM';

export default Hero;

export {
  HeroReplay,
  DetachedDOM,
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
