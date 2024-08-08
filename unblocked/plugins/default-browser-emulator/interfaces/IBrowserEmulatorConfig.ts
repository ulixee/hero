import type { Args as ConsoleArgs } from '../injected-scripts/console';
import type { Args as ErrorArgs } from '../injected-scripts/error';

export default interface IBrowserEmulatorConfig {
  [InjectedScript.CONSOLE]: InjectedScriptConfig<ConsoleArgs>;
  [InjectedScript.DOCUMENT_PROTOTYPE_COOKIE]: InjectedScriptConfig;
  [InjectedScript.ERROR]: InjectedScriptConfig<ErrorArgs>;
  [InjectedScript.JSON_STRINGIFY]: InjectedScriptConfig;
  [InjectedScript.MEDIA_DEVICES_PROTOTYPE_ENUMERATE_DEVICES]: InjectedScriptConfig;
  [InjectedScript.NAVIGATOR_DEVICE_MEMORY]: InjectedScriptConfig;
  [InjectedScript.NAVIGATOR_HARDWARE_CONCURRENCY]: InjectedScriptConfig;
  [InjectedScript.NAVIGATOR]: InjectedScriptConfig;
  [InjectedScript.PERFORMANCE]: InjectedScriptConfig;
  [InjectedScript.POLYFILL_ADD]: InjectedScriptConfig;
  [InjectedScript.POLYFILL_MODIFY]: InjectedScriptConfig;
  [InjectedScript.POLYFILL_REMOVE]: InjectedScriptConfig;
  [InjectedScript.POLYFILL_REORDER]: InjectedScriptConfig;
  [InjectedScript.RTC_RTP_SENDER_GETCAPABILITIES]: InjectedScriptConfig;
  [InjectedScript.SHAREDWORKER_PROTOTYPE]: InjectedScriptConfig;
  [InjectedScript.SPEECH_SYNTHESIS_GETVOICES]: InjectedScriptConfig;
  [InjectedScript.UNHANDLED_ERRORS_AND_REJECTIONS]: InjectedScriptConfig;
  [InjectedScript.WEBGL_RENDERING_CONTEXT_PROTOTYPE_GETPARAMETERS]: InjectedScriptConfig;
  [InjectedScript.WEBRTC]: InjectedScriptConfig;
  [InjectedScript.WINDOW_SCREEN]: InjectedScriptConfig;
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

export type InjectedScriptConfig<T = never> = T | boolean;
