import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IBrowserData from '../interfaces/IBrowserData';
import IUserAgentData from '../interfaces/IUserAgentData';
import DomOverridesBuilder from './DomOverridesBuilder';

export default function loadDomOverrides(
  emulationProfile: IEmulationProfile,
  data: IBrowserData,
  userAgentData: IUserAgentData,
): DomOverridesBuilder {
  const domOverrides = new DomOverridesBuilder();

  const deviceProfile = emulationProfile.deviceProfile;
  const isHeadless =
    emulationProfile.browserEngine.isHeaded !== true &&
    emulationProfile.browserEngine.isHeadlessNew !== true;

  domOverrides.add('navigator.hardwareConcurrency', {
    concurrency: deviceProfile.hardwareConcurrency,
  });
  domOverrides.add('navigator.deviceMemory', {
    memory: deviceProfile.deviceMemory,
    storageTib: deviceProfile.deviceStorageTib,
    maxHeapSize: deviceProfile.maxHeapSize,
  });
  domOverrides.add('navigator', {
    userAgentString: emulationProfile.userAgentOption.string,
    platform: emulationProfile.windowNavigatorPlatform,
    headless: isHeadless,
    pdfViewerEnabled: data.windowNavigator.navigator.pdfViewerEnabled?._$value,
    userAgentData,
    rtt: emulationProfile.deviceProfile.rtt,
  });

  domOverrides.add('MediaDevices.prototype.enumerateDevices', {
    videoDevice: deviceProfile.videoDevice,
  });

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

  domOverrides.add('WebGLRenderingContext.prototype.getParameter', deviceProfile.webGlParameters);
  domOverrides.add('console');
  domOverrides.add('SharedWorker.prototype');

  if (emulationProfile.consoleLogPageJson) {
    domOverrides.add('JSON.stringify');
  }

  const locale = emulationProfile.locale;
  const voices = data.speech.voices?.map(x => {
    x.default = locale.includes(x.lang);
    return x;
  });
  if (voices?.length) {
    domOverrides.add('speechSynthesis.getVoices', { voices });
  }
  const frame = data.windowFraming;

  if (Number(emulationProfile.browserEngine.fullVersion.split('.')[0]) >= 109) {
    domOverrides.add('performance');
  }
  domOverrides.add('window.screen', {
    unAvailHeight: frame.screenGapTop + frame.screenGapBottom,
    unAvailWidth: frame.screenGapLeft + frame.screenGapRight,
    colorDepth: emulationProfile.viewport.colorDepth ?? frame.colorDepth,
  });

  domOverrides.registerWorkerOverrides(
    'console',
    'navigator.deviceMemory',
    'navigator.hardwareConcurrency',
    'navigator',
    'WebGLRenderingContext.prototype.getParameter',
  );
  return domOverrides;
}
