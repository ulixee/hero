import '@ulixee/commons/SourceMapSupport';
import {
  BlockedResourceType,
  ConnectionToCore,
  ConnectionToRemoteCoreServer,
  FrameEnvironment,
  InteractionCommand,
  KeyboardKeys,
  LocationStatus,
  LocationTrigger,
  MouseButton,
  Node,
  ResourceType,
  Tab,
  XPathResult,
} from '@ulixee/hero';
import Core, { GlobalPool } from '@ulixee/hero-core';
import ShutdownHandler from '@ulixee/commons/ShutdownHandler';
import Hero from './lib/Hero';

ShutdownHandler.exitOnSignal = false;

Core.start().catch(error => {
  console.log('ERROR starting Core within Fullstack', error); // eslint-disable-line no-console
});

if (process.env.NODE_ENV !== 'test') {
  GlobalPool.events.on('browser-closed-all-windows', ({ puppet }) => puppet.close());
  GlobalPool.events.on('all-browsers-closed', () => Core.shutdown());
}
export {
  Core,
  ConnectionToRemoteCoreServer,
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
};

export default Hero;
