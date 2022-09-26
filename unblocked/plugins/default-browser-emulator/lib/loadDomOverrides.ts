import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import DomOverridesBuilder from './DomOverridesBuilder';
import IBrowserData from '../interfaces/IBrowserData';
import parseNavigatorPlugins from './utils/parseNavigatorPlugins';
import IUserAgentData from '../interfaces/IUserAgentData';

export default function loadDomOverrides(
  emulationProfile: IEmulationProfile,
  data: IBrowserData,
  userAgentData: IUserAgentData,
): DomOverridesBuilder {
  const domOverrides = new DomOverridesBuilder();

  domOverrides.add('Error.captureStackTrace');
  domOverrides.add('Error.constructor');
  const deviceProfile = emulationProfile.deviceProfile;

  domOverrides.add('navigator.deviceMemory', {
    memory: deviceProfile.deviceMemory,
    maxHeapSize: deviceProfile.maxHeapSize,
  });
  domOverrides.add('navigator', {
    userAgentString: emulationProfile.userAgentOption.string,
    platform: emulationProfile.userAgentOption.operatingSystemPlatform,
    headless: emulationProfile.browserEngine.isHeaded !== true,
    pdfViewerEnabled: data.windowNavigator.navigator.pdfViewerEnabled?._$value,
    userAgentData,
  });

  domOverrides.add('MediaDevices.prototype.enumerateDevices', {
    videoDevice: deviceProfile.videoDevice,
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
  domOverrides.add('WebGLRenderingContext.prototype.getParameter', deviceProfile.webGlParameters);
  domOverrides.add('console.debug');
  domOverrides.add('HTMLIFrameElement.prototype');

  domOverrides.add('window.outerWidth', {
    frameBorderWidth: data.windowFraming.frameBorderWidth,
  });
  domOverrides.add('window.outerHeight', {
    frameBorderHeight: data.windowFraming.frameBorderHeight,
  });

  return domOverrides;
}
