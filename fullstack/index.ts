import '@ulixee/commons/lib/SourceMapSupport';
import { ISuperDocument, ISuperElement, ISuperNode, ISuperNodeList, ISuperHTMLCollection, ISuperText, ISuperStyleSheet, ISuperHTMLElement } from "awaited-dom/base/interfaces/super";
import {
  BlockedResourceType,
  ConnectionToCore,
  ConnectionToRemoteCoreServer,
  FrameEnvironment,
  InteractionCommand,
  KeyboardKey,
  LocationStatus,
  LocationTrigger,
  MouseButton,
  Node,
  IResourceType,
  ResourceType,
  Tab,
  XPathResult,
  IHeroCreateOptions,
  IConnectionToCoreOptions,
} from '@ulixee/hero';
import Core from '@ulixee/hero-core';
import Hero from './lib/Hero';

export {
  Core,
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

export default Hero;
