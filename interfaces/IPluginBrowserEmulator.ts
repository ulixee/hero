import { URL } from 'url';
import { IPuppetPage } from './IPuppetPage';
import { IPuppetWorker } from './IPuppetWorker';
import IDnsSettings from './IDnsSettings';
import ITcpSettings from './ITcpSettings';
import ITlsSettings from './ITlsSettings';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';
import IViewport from './IViewport';
import IBrowserEngine from './IBrowserEngine';
import { PluginTypes } from './IPluginTypes';
import IPluginCreateOptions from './IPluginCreateOptions';
import IUserAgentOption, { IVersion } from './IUserAgentOption';

export interface IBrowserEmulatorClass {
  id: string;
  pluginType: PluginTypes.BrowserEmulator;
  selectBrowserMeta: (userAgentSelector: string) => ISelectBrowserMeta;
  new (createOptions: IPluginCreateOptions, userAgentOption: IUserAgentOption): IBrowserEmulator;
}

export interface ISelectBrowserMeta {
  userAgentOption: IUserAgentOption;
  browserEngine: IBrowserEngine;
}

export interface IBrowserEmulator extends IBrowserEmulatorMethods, IBrowserEmulatorConfig {
  id: string;

  browserName: string;
  browserVersion: IVersion;

  operatingSystemPlatform: string;
  operatingSystemName: string;
  operatingSystemVersion: IVersion;

  userAgentString: string;
}

export interface IBrowserEmulatorMethods {
  configure?(options: IBrowserEmulatorConfig): Promise<any> | void;

  onDnsConfiguration?(settings: IDnsSettings): Promise<any> | void;
  onTcpConfiguration?(settings: ITcpSettings): Promise<any> | void;
  onTlsConfiguration?(settings: ITlsSettings): Promise<any> | void;

  beforeHttpRequest?(request: IHttpResourceLoadDetails): Promise<any> | void;
  beforeHttpResponse?(resource: IHttpResourceLoadDetails): Promise<any> | void;

  onNewPuppetPage?(page: IPuppetPage): Promise<any>;
  onNewPuppetWorker?(worker: IPuppetWorker): Promise<any>;

  websiteHasFirstPartyInteraction?(url: URL): Promise<any> | void; // needed for implementing first-party cookies
}

export interface IBrowserEmulatorConfig {
  viewport?: IViewport;
  timezoneId?: string;
  locale?: string;
}

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BrowserEmulatorClassDecorator(constructor: IBrowserEmulatorClass): void {}
