import IUserAgentOption from '@secret-agent/interfaces/IUserAgentOption';
import IBrowserEngineOption from '@secret-agent/interfaces/IBrowserEngineOption';

export default interface IBrowserData
  extends Omit<IDataCore, 'browserEngineOptions' | 'userAgentOptions'> {
  browserConfig: IDataBrowserConfig;
  clienthello: IDataClienthello;
  codecs: IDataCodecs;
  windowChrome: IDataWindowChrome;
  windowFraming: IDataWindowFraming;
  windowNavigator: IDataWindowNavigator;
  domPolyfill: IDataDomPolyfill;
  windowBaseFraming: IDataWindowFraming;
  headers: IDataHeaders;
  deviceMemory?: number;
  videoDevice?: {
    deviceId: string;
    groupId: string;
  };
  webGLParameters?: Record<string, string | number | boolean>;
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

export interface IDataCore {
  pkg: any;
  browserEngineOptions: IDataBrowserEngineOptions;
  userAgentOptions: IDataUserAgentOptions;
}

export type IDataBrowserEngineOptions = IBrowserEngineOption[];
export type IDataUserAgentOptions = IDataUserAgentOption[];

export interface IDataUserAgentOption extends Omit<IUserAgentOption, 'string'> {
  string?: string;
  strings?: string[];
}

export interface IDataHeaders {
  [protocol: string]: {
    [resourceType: string]: IDataHeaderOrder[];
  };
}

export interface IDataHeaderOrder {
  originTypes: string[];
  method: string;
  order: string[];
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
