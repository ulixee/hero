import BrowserEmulator from '@ulixee/hero-plugin-utils/lib/BrowserEmulator';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
import IDnsSettings from '@ulixee/hero-interfaces/IDnsSettings';
import ITcpSettings from '@ulixee/hero-interfaces/ITcpSettings';
import ITlsSettings from '@ulixee/hero-interfaces/ITlsSettings';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import {
  BrowserEmulatorClassDecorator,
  IBrowserEmulatorConfig,
  ISessionSummary,
} from '@ulixee/hero-interfaces/ICorePlugin';
import { IPuppetWorker } from '@ulixee/hero-interfaces/IPuppetWorker';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';
import IUserAgentOption from '@ulixee/hero-interfaces/IUserAgentOption';
import BrowserEngine from '@ulixee/hero-plugin-utils/lib/BrowserEngine';
import IGeolocation from '@ulixee/hero-interfaces/IGeolocation';
import IHttp2ConnectSettings from '@ulixee/hero-interfaces/IHttp2ConnectSettings';
import Viewports from './lib/Viewports';
import setWorkerDomOverrides from './lib/setWorkerDomOverrides';
import setPageDomOverrides from './lib/setPageDomOverrides';
import setUserAgent from './lib/helpers/setUserAgent';
import setScreensize from './lib/helpers/setScreensize';
import setTimezone from './lib/helpers/setTimezone';
import setLocale from './lib/helpers/setLocale';
import setActiveAndFocused from './lib/helpers/setActiveAndFocused';
import selectUserAgentOption from './lib/helpers/selectUserAgentOption';
import modifyHeaders from './lib/helpers/modifyHeaders';
import configureSessionDns from './lib/helpers/configureSessionDns';
import configureSessionTcp from './lib/helpers/configureSessionTcp';
import configureSessionTls from './lib/helpers/configureSessionTls';
import FirstPartyCookiesPlugin from './lib/plugins/FirstPartyCookiesPlugin';
import DataLoader from './lib/DataLoader';
import IBrowserData from './interfaces/IBrowserData';
import selectBrowserEngineOption from './lib/helpers/selectBrowserEngineOption';
import setGeolocation from './lib/helpers/setGeolocation';
import { configureBrowserLaunchArgs } from './lib/helpers/configureBrowserLaunchArgs';
import loadDomOverrides from './lib/loadDomOverrides';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import configureDeviceProfile from './lib/helpers/configureDeviceProfile';
import configureHttp2Session from './lib/helpers/configureHttp2Session';

const dataLoader = new DataLoader(__dirname);
export const latestBrowserEngineId = 'chrome-89-0';
export const latestChromeBrowserVersion = { major: '89', minor: '0' };

@BrowserEmulatorClassDecorator
export default class DefaultBrowserEmulator extends BrowserEmulator {
  public static id = dataLoader.pkg.name.replace('@ulixee/', '');

  public timezoneId: string;
  public locale: string;
  public viewport: IViewport;
  public geolocation: IGeolocation;
  public dnsOverTlsProvider: IDnsSettings['dnsOverTlsConnection'];

  protected readonly data: IBrowserData;
  private readonly domOverridesBuilder: DomOverridesBuilder;

  constructor(createOptions: ICorePluginCreateOptions) {
    super(createOptions);
    this.data = dataLoader.as(createOptions.userAgentOption) as any;

    // set default device profile options
    configureDeviceProfile(this.deviceProfile);

    if (this.data.browserConfig.features.includes('FirstPartyCookies')) {
      createOptions.corePlugins.use(FirstPartyCookiesPlugin);
    }
    this.domOverridesBuilder = loadDomOverrides(this, this.data);
  }

  configure(config: IBrowserEmulatorConfig): void {
    if (!config) return;

    config.locale ??= this.locale ?? this.data.browserConfig.defaultLocale;
    config.viewport ??=
      this.viewport ?? Viewports.getDefault(this.data.windowBaseFraming, this.data.windowFraming);
    config.timezoneId ??= this.timezoneId ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    config.geolocation ??= this.geolocation;

    this.locale = config.locale;
    this.viewport = config.viewport;
    this.timezoneId = config.timezoneId;
    this.geolocation = config.geolocation;
    this.dnsOverTlsProvider = config.dnsOverTlsProvider;
  }

  public onDnsConfiguration(settings: IDnsSettings): void {
    configureSessionDns(this, settings);

    if (this.dnsOverTlsProvider !== undefined) {
      settings.dnsOverTlsConnection = this.dnsOverTlsProvider;
    }
  }

  public onTcpConfiguration(settings: ITcpSettings): void {
    configureSessionTcp(this, settings);
  }

  public onTlsConfiguration(settings: ITlsSettings): void {
    configureSessionTls(this, settings);
  }

  public beforeHttpRequest(resource: IHttpResourceLoadDetails): void {
    modifyHeaders(this, this.data, resource);
  }

  public onHttp2SessionConnect(
    request: IHttpResourceLoadDetails,
    settings: IHttp2ConnectSettings,
  ): void {
    configureHttp2Session(this, this.data, request, settings);
  }

  public onNewPuppetPage(page: IPuppetPage, sessionMeta: ISessionSummary): Promise<any> {
    // Don't await here! we want to queue all these up to run before the debugger resumes
    const devtools = page.devtoolsSession;
    return Promise.all([
      setUserAgent(this, devtools),
      setTimezone(this, devtools),
      setLocale(this, devtools),
      setScreensize(this, page, devtools, sessionMeta),
      setActiveAndFocused(this, devtools),
      setPageDomOverrides(this.domOverridesBuilder, this.data, page),
      setGeolocation(this, page),
    ]);
  }

  public onNewPuppetWorker(worker: IPuppetWorker): Promise<any> {
    const devtools = worker.devtoolsSession;
    return Promise.all([
      setUserAgent(this, devtools),
      setWorkerDomOverrides(this.domOverridesBuilder, this.data, worker),
    ]);
  }

  public static selectBrowserMeta(userAgentSelector?: string): {
    browserEngine: BrowserEngine;
    userAgentOption: IUserAgentOption;
  } {
    const userAgentOption = selectUserAgentOption(userAgentSelector, dataLoader.userAgentOptions);

    const { browserName, browserVersion } = userAgentOption;
    const browserEngineId = `${browserName}-${browserVersion.major}-${browserVersion.minor}`;
    const browserEngineOption = selectBrowserEngineOption(
      browserEngineId,
      dataLoader.browserEngineOptions,
    );
    const browserEngine = new BrowserEngine(this, browserEngineOption);
    return { browserEngine, userAgentOption };
  }

  public static onBrowserWillLaunch(
    browserEngine: BrowserEngine,
    options: {
      showBrowser?: boolean;
      disableGpu?: boolean;
      disableDevtools?: boolean;
    },
  ): void {
    configureBrowserLaunchArgs(browserEngine, options);
  }
}
