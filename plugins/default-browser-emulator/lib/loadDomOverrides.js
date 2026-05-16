"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loadDomOverrides;
const DomOverridesBuilder_1 = require("./DomOverridesBuilder");
const IBrowserEmulatorConfig_1 = require("../interfaces/IBrowserEmulatorConfig");
function loadDomOverrides(config, emulationProfile, data, userAgentData) {
    const domOverrides = new DomOverridesBuilder_1.default(config);
    const deviceProfile = emulationProfile.deviceProfile;
    const isHeadless = emulationProfile.browserEngine.isHeaded !== true &&
        emulationProfile.browserEngine.isHeadlessNew !== true;
    const locale = emulationProfile.locale;
    const voices = data.speech.voices?.map(x => {
        x.default = locale.includes(x.lang);
        return x;
    });
    const domPolyfill = data.domPolyfill;
    const consolePluginUsed = !!config[IBrowserEmulatorConfig_1.InjectedScript.CONSOLE];
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.ERROR, {
        removeInjectedLines: true,
        applyStackTraceLimit: true,
        fixConsoleStack: consolePluginUsed,
    }, { registerWorkerOverride: true });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.CONSOLE, undefined, { registerWorkerOverride: true });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.JSON_STRINGIFY, undefined, { registerWorkerOverride: true });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.MEDIA_DEVICES_PROTOTYPE_ENUMERATE_DEVICES, {
        groupId: deviceProfile.videoDevice?.groupId,
        deviceId: deviceProfile.videoDevice?.deviceId,
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.NAVIGATOR, {
        userAgentString: emulationProfile.userAgentOption.string,
        platform: emulationProfile.windowNavigatorPlatform,
        headless: isHeadless,
        pdfViewerEnabled: data.windowNavigator.navigator.pdfViewerEnabled?._$value,
        userAgentData,
        rtt: emulationProfile.deviceProfile.rtt,
    }, { registerWorkerOverride: true });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.NAVIGATOR_DEVICE_MEMORY, {
        memory: deviceProfile.deviceMemory,
        storageTib: deviceProfile.deviceStorageTib,
        maxHeapSize: deviceProfile.maxHeapSize,
    }, { registerWorkerOverride: true });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.NAVIGATOR_HARDWARE_CONCURRENCY, {
        concurrency: deviceProfile.hardwareConcurrency,
    }, { registerWorkerOverride: true });
    if (Number(emulationProfile.browserEngine.fullVersion.split('.')[0]) >= 109) {
        domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.PERFORMANCE, undefined);
    }
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_ADD, {
        itemsToAdd: domPolyfill?.add ?? [],
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_MODIFY, {
        itemsToModify: domPolyfill?.modify ?? [],
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_REMOVE, {
        itemsToRemove: domPolyfill?.remove ?? [],
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.POLYFILL_REORDER, {
        itemsToReorder: domPolyfill?.reorder ?? [],
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.SHAREDWORKER_PROTOTYPE, undefined, {
        registerWorkerOverride: true,
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.SPEECH_SYNTHESIS_GETVOICES, { voices });
    const frame = data.windowFraming;
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.WINDOW_SCREEN, {
        unAvailHeight: frame.screenGapTop + frame.screenGapBottom,
        unAvailWidth: frame.screenGapLeft + frame.screenGapRight,
        colorDepth: emulationProfile.viewport.colorDepth ?? frame.colorDepth,
    });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.UNHANDLED_ERRORS_AND_REJECTIONS, { preventDefaultUncaughtError: true, preventDefaultUnhandledRejection: true }, { registerWorkerOverride: true });
    domOverrides.addOverrideAndUseConfig(IBrowserEmulatorConfig_1.InjectedScript.WEBGL_RENDERING_CONTEXT_PROTOTYPE_GETPARAMETERS, deviceProfile.webGlParameters, { registerWorkerOverride: true });
    return domOverrides;
}
//# sourceMappingURL=loadDomOverrides.js.map