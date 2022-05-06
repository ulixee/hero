import '@ulixee/commons/lib/SourceMapSupport';
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
  LoadStatus,
  XPathResult,
  IHeroCreateOptions,
  IConnectionToCoreOptions,
} from '@ulixee/hero';
import Core from '@ulixee/hero-core';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import Hero from './lib/Hero';

ShutdownHandler.exitOnSignal = false;

if (process.env.NODE_ENV !== 'test') {
  Core.pool.on('browser-has-no-open-windows', ({ browser }) => browser.close());
  Core.pool.on('all-browsers-closed', () => Core.shutdown());
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
