import { randomBytes } from 'crypto';
import { BrowserEmulatorBase } from '@secret-agent/plugin-utils';
import DomOverridesBuilder from './DomOverridesBuilder';
import IBrowserData from '../interfaces/IBrowserData';
import parseNavigatorPlugins from './utils/parseNavigatorPlugins';

export default function loadDomOverrides(
  emulator: BrowserEmulatorBase,
  data: IBrowserData,
): DomOverridesBuilder {
  const domOverrides = new DomOverridesBuilder();

  domOverrides.add('Error.captureStackTrace');
  domOverrides.add('Error.constructor');

  const deviceMemory = Math.ceil(Math.random() * 4) * 2;
  domOverrides.add('navigator.deviceMemory', { memory: deviceMemory });
  domOverrides.add('navigator', {
    userAgentString: emulator.userAgentString,
    platform: emulator.operatingSystemPlatform,
    headless: emulator.browserEngine.isHeaded !== true,
  });

  domOverrides.add('MediaDevices.prototype.enumerateDevices', {
    videoDevice: {
      deviceId: randomBytes(32).toString('hex'),
      groupId: randomBytes(32).toString('hex'),
    },
  });

  domOverrides.add('Notification.permission');
  domOverrides.add('Permission.prototype.query');

  const windowChrome = data.windowChrome;
  if (windowChrome) {
    domOverrides.add('window.chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: windowChrome.chrome,
        prevProperty: windowChrome.prevProperty,
      },
    });
  }

  const domPolyfill = data.domPolyfill;
  if (domPolyfill) {
    if (domPolyfill?.add?.length) {
      domOverrides.add('polyfill.add', {
        itemsToAdd: domPolyfill.add,
      });
    }
    if (domPolyfill?.remove?.length) {
      domOverrides.add('polyfill.remove', {
        itemsToRemove: domPolyfill.remove,
      });
    }
    if (domPolyfill?.modify?.length) {
      domOverrides.add('polyfill.modify', {
        itemsToModify: domPolyfill.modify,
      });
    }
    if (domPolyfill?.reorder?.length) {
      domOverrides.add('polyfill.reorder', {
        itemsToReorder: domPolyfill.reorder,
      });
    }
  }

  const windowNavigator = data.windowNavigator;
  domOverrides.add('navigator.plugins', parseNavigatorPlugins(windowNavigator.navigator));
  domOverrides.add('WebGLRenderingContext.prototype.getParameter', {
    // UNMASKED_VENDOR_WEBGL
    37445: 'Intel Inc.',
    // UNMASKED_RENDERER_WEBGL
    37446: 'Intel Iris OpenGL Engine',
  });
  domOverrides.add('console.debug');
  domOverrides.add('HTMLIFrameElement.prototype');
  domOverrides.add('Element.prototype.attachShadow');

  domOverrides.add('window.outerWidth', {
    frameBorderWidth: data.windowFraming.frameBorderWidth,
  });
  domOverrides.add('window.outerHeight', {
    frameBorderHeight: data.windowFraming.frameBorderHeight,
  });

  const agentCodecs = data.codecs;
  if (agentCodecs) {
    domOverrides.add('HTMLMediaElement.prototype.canPlayType', {
      audioCodecs: agentCodecs.audioSupport,
      videoCodecs: agentCodecs.videoSupport,
    });
    domOverrides.add('MediaRecorder.isTypeSupported', {
      supportedCodecs: [
        ...agentCodecs.audioSupport.recordingFormats,
        ...agentCodecs.videoSupport.recordingFormats,
      ],
    });
    domOverrides.add('RTCRtpSender.getCapabilities', {
      videoCodecs: agentCodecs.webRtcVideoCodecs,
      audioCodecs: agentCodecs.webRtcAudioCodecs,
    });
  }

  return domOverrides;
}
