import '@ulixee/commons/lib/SourceMapSupport';
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
  IResourceType,
  Tab,
  XPathResult,
} from '@ulixee/hero';
import Core, { GlobalPool } from '@ulixee/hero-core';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import Hero from './lib/Hero';

ShutdownHandler.exitOnSignal = false;

Core.start().catch(error => {
  console.log('ERROR starting Core within Fullstack', error); // eslint-disable-line no-console
});

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
