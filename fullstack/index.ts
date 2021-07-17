import '@ulixee/commons/SourceMapSupport';
import {
  Observable,
  RemoteServerConnectionToCore,
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
} from '@ulixee/hero';
import Core from '@ulixee/hero-core';
import Hero from './lib/Hero';

Core.start().catch(error => {
  console.log('ERROR starting Core within Fullstack', error);
});

export {
  Core,
  Observable,
  RemoteServerConnectionToCore,
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
}

export default Hero;
