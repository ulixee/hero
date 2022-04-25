import { URL } from 'url';
import Protocol from 'devtools-protocol';
import IPluginTypes, { PluginTypes } from './IPluginTypes';
import ICorePluginCreateOptions from './ICorePluginCreateOptions';
import { IInteractionGroups, IInteractionStep } from './IInteractions';
import IInteractionsHelper from './IInteractionsHelper';
import IPoint from './IPoint';
import IBrowserEngine from './IBrowserEngine';
import IUserAgentOption, { IVersion } from './IUserAgentOption';
import IDnsSettings from './IDnsSettings';
import ITcpSettings from './ITcpSettings';
import ITlsSettings from './ITlsSettings';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';
import { IPuppetPage } from './IPuppetPage';
import { IPuppetWorker } from './IPuppetWorker';
import IDeviceProfile from './IDeviceProfile';
import IHttp2ConnectSettings from './IHttp2ConnectSettings';
import ISessionCreateOptions from './ISessionCreateOptions';
import { IPuppetFrame } from './IPuppetFrame';
import IDevtoolsSession from './IDevtoolsSession';
import IHttpSocketAgent from './IHttpSocketAgent';
import IPuppetContext from './IPuppetContext';

export default interface ICorePlugin
  extends ICorePluginMethods,
    IBrowserEmulatorMethods,
    IHumanEmulatorMethods {
  id: string;
}

export interface ICorePluginClass {
  id: string;
  type: IPluginTypes;
  new (createOptions: ICorePluginCreateOptions): ICorePlugin;
}

export interface ICorePluginMethods {
  onClientCommand?(meta: IOnClientCommandMeta, ...args: any[]): Promise<any>;
  onDevtoolsPanelAttached?(
    devtoolsSession: IDevtoolsSession,
    sessionSummary?: ISessionSummary,
  ): Promise<any>;
  onDevtoolsPanelDetached?(
    devtoolsSession: IDevtoolsSession,
    sessionSummary?: ISessionSummary,
  ): Promise<any>;
  onServiceWorkerAttached?(
    devtoolsSession: IDevtoolsSession,
    event: Protocol.Target.AttachedToTargetEvent,
    sessionSummary?: ISessionSummary,
  ): Promise<any>;
}

export interface IOnClientCommandMeta {
  puppetPage: IPuppetPage;
  puppetFrame?: IPuppetFrame;
  sessionSummary: ISessionSummary;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CorePluginClassDecorator(staticClass: ICorePluginClass): void {}

// HUMAN EMULATORS ///////////////////////////////////////////////////////////////////////////////////////////////////

export interface IHumanEmulatorClass {
  id: string;
  type: PluginTypes.HumanEmulator;
  new (createOptions: ICorePluginCreateOptions): IHumanEmulator;
}

export interface IHumanEmulator extends ICorePlugin {
  id: string;
}

export interface IHumanEmulatorMethods {
  playInteractions?(
    interactions: IInteractionGroups,
    runFn: (interaction: IInteractionStep) => Promise<void>,
    helper?: IInteractionsHelper,
    sessionSummary?: ISessionSummary,
  ): Promise<void>;
  getStartingMousePoint?(
    helper?: IInteractionsHelper,
    sessionSummary?: ISessionSummary,
  ): Promise<IPoint>;
}

// decorator for human emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HumanEmulatorClassDecorator(staticClass: IHumanEmulatorClass): void {}

// BROWSER EMULATORS ///////////////////////////////////////////////////////////////////////////////////////////////////

export interface IBrowserEmulatorClass {
  id: string;
  type: PluginTypes.BrowserEmulator;
  selectBrowserMeta(userAgentSelector: string): ISelectBrowserMeta;
  onBrowserWillLaunch?(
    browserEngine: IBrowserEngine,
    launchSettings: {
      showBrowser?: boolean;
      disableGpu?: boolean;
      disableDevtools?: boolean;
    },
  ): void;
  new (createOptions: ICorePluginCreateOptions): IBrowserEmulator;
}

export interface ISelectBrowserMeta {
  userAgentOption: IUserAgentOption;
  browserEngine: IBrowserEngine;
}

export interface IBrowserEmulator extends ICorePlugin {
  id: string;

  browserName: string;
  browserVersion: IVersion;

  operatingSystemPlatform: string;
  operatingSystemName: string;
  operatingSystemVersion: IVersion;

  userAgentString: string;
  deviceProfile: IDeviceProfile;
}

export interface IBrowserEmulatorMethods {
  configure?(options: IBrowserEmulatorConfig, sessionSummary?: ISessionSummary): void;

  onBrowserLaunchConfiguration?(launchArguments: string[], sessionSummary?: ISessionSummary): Promise<void> | void;

  onDnsConfiguration?(settings: IDnsSettings, sessionSummary?: ISessionSummary): void;
  onTcpConfiguration?(settings: ITcpSettings, sessionSummary?: ISessionSummary): void;
  onTlsConfiguration?(settings: ITlsSettings, sessionSummary?: ISessionSummary): void;
  onHttpAgentInitialized?(agent: IHttpSocketAgent): Promise<any> | void;

  onHttp2SessionConnect?(
    request: IHttpResourceLoadDetails,
    settings: IHttp2ConnectSettings,
    sessionSummary?: ISessionSummary,
  ): Promise<any> | void;
  beforeHttpRequest?(
    request: IHttpResourceLoadDetails,
    sessionSummary?: ISessionSummary,
  ): Promise<any> | void;
  beforeHttpResponse?(
    resource: IHttpResourceLoadDetails,
    sessionSummary?: ISessionSummary,
  ): Promise<any> | void;

  onNewPuppetPage?(page: IPuppetPage, sessionSummary?: ISessionSummary): Promise<any>;
  onNewPuppetWorker?(worker: IPuppetWorker, sessionSummary?: ISessionSummary): Promise<any>;
  onNewPuppetContext?(context: IPuppetContext, sessionSummary?: ISessionSummary): Promise<any>;

  websiteHasFirstPartyInteraction?(url: URL, sessionSummary?: ISessionSummary): Promise<any> | void; // needed for implementing first-party cookies
}

export interface ISessionSummary {
  id: string;
  options?: ISessionCreateOptions;
}

export type IBrowserEmulatorConfig = Pick<
  ISessionCreateOptions,
  | 'viewport'
  | 'geolocation'
  | 'timezoneId'
  | 'locale'
  | 'upstreamProxyIpMask'
  | 'upstreamProxyUrl'
  | 'dnsOverTlsProvider'
>;

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BrowserEmulatorClassDecorator(staticClass: IBrowserEmulatorClass): void {}
