import IBrowserEngineOption from '@ulixee/unblocked-specification/agent/browser/IBrowserEngineOption';

export default interface IBrowserData
  extends Omit<IDataCore, 'browserEngineOptions' | 'userAgentOptions'> {
  browserConfig: IDataBrowserConfig;
  clienthello: IDataClienthello;
  codecs: IDataCodecs;
  windowChrome: IDataWindowChrome;
  windowFraming: IDataWindowFraming;
  windowNavigator: IDataWindowNavigator;
  http2Settings: IDataHttp2Settings;
  domPolyfill: IDataDomPolyfill;
  windowBaseFraming: IDataWindowFraming;
  headers: IDataHeaders;
  speech: IDataSpeechVoices;
}

export interface IDataBrowserConfig {
  defaultLocale: string;
  features: string[];
}

export interface IDataWindowNavigator {
  navigator: any;
}

export interface IDataDomPolyfill {
  add: any[];
  remove: any[];
  modify: any[];
  reorder: any[];
}

export interface IDataWindowChrome {
  chrome: any;
  prevProperty: string;
}

export interface IDataClienthello {
  version: string;
  ciphers: any[];
  compressionMethods: any[];
  extensions: any[];
}

export interface IDataCodecs {
  audioSupport: any;
  videoSupport: any;
  webRtcAudioCodecs: any;
  webRtcVideoCodecs: any;
}

export interface IDataFonts {
  fonts: string[];
}

export interface IDataSpeechVoices {
  voices: {
    default: boolean;
    lang: string;
    localService: boolean;
    name: string;
    voiceURI: string;
  }[];
}

export interface IDataHttp2Settings {
  settings: any;
  ping: string;
  initialWindowSize: number;
  firstFrameWindowSize: number;
}

export interface IDataCore {
  pkg: any;
  browserEngineOptions: IDataBrowserEngineOptions;
}

export type IDataBrowserEngineOptions = IBrowserEngineOption[];

export interface IDataHeaders {
  [protocol: string]: {
    [resourceType: string]: IDataHeaderOrder[];
  };
}

export interface IDataHeaderOrder {
  originTypes: string[];
  method: string;
  order: string[];
  isRedirect: boolean;
  defaults: { [header: string]: string[] };
  orderKeys?: Set<string>; // constructed as accessed
}

export interface IDataWindowFraming {
  screenGapLeft: number;
  screenGapTop: number;
  screenGapRight: number;
  screenGapBottom: number;
  frameBorderWidth: number;
  frameBorderHeight: number;
}
