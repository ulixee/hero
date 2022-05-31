import '@ulixee/commons/lib/SourceMapSupport';
import type {
  ISuperDocument,
  ISuperElement,
  ISuperHTMLCollection,
  ISuperHTMLElement,
  ISuperNode,
  ISuperNodeList,
  ISuperStyleSheet,
  ISuperText,
} from 'awaited-dom/base/interfaces/super';
import {
  BlockedResourceType,
  ConnectionToHeroCore,
  FrameEnvironment,
  IConnectionToCoreOptions,
  IHeroCreateOptions,
  InteractionCommand,
  IResourceType,
  KeyboardKey,
  LoadStatus,
  LocationStatus,
  LocationTrigger,
  MouseButton,
  Node,
  ResourceType,
  Tab,
  XPathResult,
} from '@ulixee/hero';
import Core from '@ulixee/hero-core';
import Hero, { createDirectConnectionToCore } from './lib/Hero';

export {
  createDirectConnectionToCore,
  Core,
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
  XPathResult,
  LocationStatus,
  LoadStatus,
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

export default Hero;
