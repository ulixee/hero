import '@ulixee/commons/lib/SourceMapSupport';
import type { ISuperDocument, ISuperElement, ISuperNode, ISuperNodeList, ISuperHTMLCollection, ISuperText, ISuperStyleSheet, ISuperHTMLElement } from "awaited-dom/base/interfaces/super";
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
import Core, { GlobalPool } from '@ulixee/hero-core';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import Hero from './lib/Hero';

ShutdownHandler.exitOnSignal = false;

if (process.env.NODE_ENV !== 'test') {
  GlobalPool.events.on('browser-has-no-open-windows', ({ puppet }) => puppet.close());
  GlobalPool.events.on('all-browsers-closed', () => Core.shutdown());
}

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
