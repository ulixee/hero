import type { Args as ConsoleArgs } from '../injected-scripts/console';
import type { Args as CookieArgs } from '../injected-scripts/Document.prototype.cookie';
import type { Args as ErrorArgs } from '../injected-scripts/error';
import type { Args as JSONArgs } from '../injected-scripts/JSON.stringify';
import type { Args as MediaDevicesArgs } from '../injected-scripts/MediaDevices.prototype.enumerateDevices';
import type { Args as DeviceMemoryArgs } from '../injected-scripts/navigator.deviceMemory';
import type { Args as HardwareConcurrencyArgs } from '../injected-scripts/navigator.hardwareConcurrency';
import type { Args as NavigatorArgs } from '../injected-scripts/navigator';
import type { Args as PerformanceArgs } from '../injected-scripts/performance';
import type { Args as PolyfillAddArgs } from '../injected-scripts/polyfill.add';
import type { Args as PolyfillModifyArgs } from '../injected-scripts/polyfill.modify';
import type { Args as PolyfillRemoveArgs } from '../injected-scripts/polyfill.remove';
import type { Args as PolyfillReorderArgs } from '../injected-scripts/polyfill.reorder';
import type { Args as RTCRtpSenderArgs } from '../injected-scripts/RTCRtpSender.getCapabilities';
import type { Args as SharedWorkerArgs } from '../injected-scripts/SharedWorker.prototype';
import type { Args as GetVoicesArgs } from '../injected-scripts/speechSynthesis.getVoices';
import type { Args as UnhandledArgs } from '../injected-scripts/UnhandledErrorsAndRejections';
import type { Args as WebGlRenderingArgs } from '../injected-scripts/WebGLRenderingContext.prototype.getParameter';
import type { Args as WebRtcArgs } from '../injected-scripts/webrtc';
import type { Args as WindowScreenArgs } from '../injected-scripts/window.screen';

// T = config used if provided
// true = plugin enabled and loadDomOverrides will provide default config
// false = plugin disabled
export type InjectedScriptConfig<T = never> = T | boolean;

export default interface IBrowserEmulatorConfig {
  [InjectedScript.CONSOLE]: InjectedScriptConfig<ConsoleArgs>;
  [InjectedScript.DOCUMENT_PROTOTYPE_COOKIE]: InjectedScriptConfig<CookieArgs>;
  [InjectedScript.ERROR]: InjectedScriptConfig<ErrorArgs>;
  [InjectedScript.JSON_STRINGIFY]: InjectedScriptConfig<JSONArgs>;
  [InjectedScript.MEDIA_DEVICES_PROTOTYPE_ENUMERATE_DEVICES]: InjectedScriptConfig<MediaDevicesArgs>;
  [InjectedScript.NAVIGATOR_DEVICE_MEMORY]: InjectedScriptConfig<DeviceMemoryArgs>;
  [InjectedScript.NAVIGATOR_HARDWARE_CONCURRENCY]: InjectedScriptConfig<HardwareConcurrencyArgs>;
  [InjectedScript.NAVIGATOR]: InjectedScriptConfig<NavigatorArgs>;
  [InjectedScript.PERFORMANCE]: InjectedScriptConfig<PerformanceArgs>;
  [InjectedScript.POLYFILL_ADD]: InjectedScriptConfig<PolyfillAddArgs>;
  [InjectedScript.POLYFILL_MODIFY]: InjectedScriptConfig<PolyfillModifyArgs>;
  [InjectedScript.POLYFILL_REMOVE]: InjectedScriptConfig<PolyfillRemoveArgs>;
  [InjectedScript.POLYFILL_REORDER]: InjectedScriptConfig<PolyfillReorderArgs>;
  [InjectedScript.RTC_RTP_SENDER_GETCAPABILITIES]: InjectedScriptConfig<RTCRtpSenderArgs>;
  [InjectedScript.SHAREDWORKER_PROTOTYPE]: InjectedScriptConfig<SharedWorkerArgs>;
  [InjectedScript.SPEECH_SYNTHESIS_GETVOICES]: InjectedScriptConfig<GetVoicesArgs>;
  [InjectedScript.UNHANDLED_ERRORS_AND_REJECTIONS]: InjectedScriptConfig<UnhandledArgs>;
  [InjectedScript.WEBGL_RENDERING_CONTEXT_PROTOTYPE_GETPARAMETERS]: InjectedScriptConfig<WebGlRenderingArgs>;
  [InjectedScript.WEBRTC]: InjectedScriptConfig<WebRtcArgs>;
  [InjectedScript.WINDOW_SCREEN]: InjectedScriptConfig<WindowScreenArgs>;
}

export enum InjectedScript {
  CONSOLE = 'console',
  DOCUMENT_PROTOTYPE_COOKIE = 'Document.prototype.cookie',
  ERROR = 'error',
  JSON_STRINGIFY = 'JSON.stringify',
  MEDIA_DEVICES_PROTOTYPE_ENUMERATE_DEVICES = 'MediaDevices.prototype.enumerateDevices',
  NAVIGATOR_DEVICE_MEMORY = 'navigator.deviceMemory',
  NAVIGATOR_HARDWARE_CONCURRENCY = 'navigator.hardwareConcurrency',
  NAVIGATOR = 'navigator',
  PERFORMANCE = 'performance',
  POLYFILL_ADD = 'polyfill.add',
  POLYFILL_MODIFY = 'polyfill.modify',
  POLYFILL_REMOVE = 'polyfill.remove',
  POLYFILL_REORDER = 'polyfill.reorder',
  RTC_RTP_SENDER_GETCAPABILITIES = 'RTCRtpSender.getCapabilities',
  SHAREDWORKER_PROTOTYPE = 'SharedWorker.prototype',
  SPEECH_SYNTHESIS_GETVOICES = 'speechSynthesis.getVoices',
  UNHANDLED_ERRORS_AND_REJECTIONS = 'UnhandledErrorsAndRejections',
  WEBGL_RENDERING_CONTEXT_PROTOTYPE_GETPARAMETERS = 'WebGLRenderingContext.prototype.getParameter',
  WEBRTC = 'webrtc',
  WINDOW_SCREEN = 'window.screen',
}
