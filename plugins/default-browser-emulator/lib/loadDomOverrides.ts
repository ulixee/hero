import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IBrowserData from '../interfaces/IBrowserData';
import IUserAgentData from '../interfaces/IUserAgentData';
import DomOverridesBuilder from './DomOverridesBuilder';
import IBrowserEmulatorConfig, { InjectedScript } from '../interfaces/IBrowserEmulatorConfig';

export default function loadDomOverrides(
  config: IBrowserEmulatorConfig,
  emulationProfile: IEmulationProfile,
  data: IBrowserData,
  userAgentData: IUserAgentData,
): DomOverridesBuilder {
  const domOverrides = new DomOverridesBuilder(config);

  const deviceProfile = emulationProfile.deviceProfile;
  const isHeadless =
    emulationProfile.browserEngine.isHeaded !== true &&
    emulationProfile.browserEngine.isHeadlessNew !== true;

  const locale = emulationProfile.locale;
  const voices = data.speech.voices?.map(x => {
    x.default = locale.includes(x.lang);
    return x;
  });

  const domPolyfill = data.domPolyfill;

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.ERROR,
    {
      removeInjectedLines: true,
      applyStackTraceLimit: true,
      fixConsoleStack: true,
    },
    { registerWorkerOverride: true },
  );

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.CONSOLE,
    undefined,
    { registerWorkerOverride: true },
  );

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.JSON_STRINGIFY,
    undefined,
    { registerWorkerOverride: true },
  );

  domOverrides.addOverrideAndUseConfig(InjectedScript.MEDIA_DEVICES_PROTOTYPE_ENUMERATE_DEVICES, {
    groupId: deviceProfile.videoDevice?.groupId,
    deviceId: deviceProfile.videoDevice?.deviceId,
  });

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.NAVIGATOR,
    {
      userAgentString: emulationProfile.userAgentOption.string,
      platform: emulationProfile.windowNavigatorPlatform,
      headless: isHeadless,
      pdfViewerEnabled: data.windowNavigator.navigator.pdfViewerEnabled?._$value,
      userAgentData,
      rtt: emulationProfile.deviceProfile.rtt,
    },
    { registerWorkerOverride: true },
  );

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.NAVIGATOR_DEVICE_MEMORY,
    {
      memory: deviceProfile.deviceMemory,
      storageTib: deviceProfile.deviceStorageTib,
      maxHeapSize: deviceProfile.maxHeapSize,
    },
    { registerWorkerOverride: true },
  );

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.NAVIGATOR_HARDWARE_CONCURRENCY,
    {
      concurrency: deviceProfile.hardwareConcurrency,
    },
    { registerWorkerOverride: true },
  );

  if (Number(emulationProfile.browserEngine.fullVersion.split('.')[0]) >= 109) {
    domOverrides.addOverrideAndUseConfig(InjectedScript.PERFORMANCE, undefined);
  }

  domOverrides.addOverrideAndUseConfig(InjectedScript.POLYFILL_ADD, {
    itemsToAdd: domPolyfill?.add ?? [],
  });

  domOverrides.addOverrideAndUseConfig(InjectedScript.POLYFILL_MODIFY, {
    itemsToModify: domPolyfill?.modify ?? [],
  });

  domOverrides.addOverrideAndUseConfig(InjectedScript.POLYFILL_REMOVE, {
    itemsToRemove: domPolyfill?.remove ?? [],
  });

  domOverrides.addOverrideAndUseConfig(InjectedScript.POLYFILL_REORDER, {
    itemsToReorder: domPolyfill?.reorder ?? [],
  });

  domOverrides.addOverrideAndUseConfig(InjectedScript.SHAREDWORKER_PROTOTYPE, undefined, {
    registerWorkerOverride: true,
  });

  domOverrides.addOverrideAndUseConfig(InjectedScript.SPEECH_SYNTHESIS_GETVOICES, { voices });

  const frame = data.windowFraming;
  domOverrides.addOverrideAndUseConfig(InjectedScript.WINDOW_SCREEN, {
    unAvailHeight: frame.screenGapTop + frame.screenGapBottom,
    unAvailWidth: frame.screenGapLeft + frame.screenGapRight,
    colorDepth: emulationProfile.viewport.colorDepth ?? frame.colorDepth,
  });

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.UNHANDLED_ERRORS_AND_REJECTIONS,
    { preventDefaultUncaughtError: true, preventDefaultUnhandledRejection: true },
    { registerWorkerOverride: true },
  );

  domOverrides.addOverrideAndUseConfig(
    InjectedScript.WEBGL_RENDERING_CONTEXT_PROTOTYPE_GETPARAMETERS,
    deviceProfile.webGlParameters,
    { registerWorkerOverride: true },
  );

  return domOverrides;
}
