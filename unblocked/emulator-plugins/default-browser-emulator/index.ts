import IEmulatorPlugin, {
  EmulatorPluginClassDecorator,
} from '@unblocked-web/emulator-spec/emulator/IEmulatorPlugin';
import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IDeviceProfile from '@unblocked-web/emulator-spec/emulator/IDeviceProfile';
import IBrowserEngine from '@unblocked-web/emulator-spec/browser/IBrowserEngine';
import IUserAgentOption from '@unblocked-web/emulator-spec/emulator/IUserAgentOption';
import IHttpResourceLoadDetails from '@unblocked-web/emulator-spec/net/IHttpResourceLoadDetails';
import IDnsSettings from '@unblocked-web/emulator-spec/net/IDnsSettings';
import ITcpSettings from '@unblocked-web/emulator-spec/net/ITcpSettings';
import ITlsSettings from '@unblocked-web/emulator-spec/net/ITlsSettings';
import { IPage } from '@unblocked-web/emulator-spec/browser/IPage';
import { IWorker } from '@unblocked-web/emulator-spec/browser/IWorker';
import IHttp2ConnectSettings from '@unblocked-web/emulator-spec/net/IHttp2ConnectSettings';
import IHttpSocketAgent from '@unblocked-web/emulator-spec/net/IHttpSocketAgent';
import Viewports from './lib/Viewports';
import BrowserEngine from './lib/BrowserEngine';
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
import DataLoader from './lib/DataLoader';
import IBrowserData from './interfaces/IBrowserData';
import selectBrowserEngineOption from './lib/helpers/selectBrowserEngineOption';
import setGeolocation from './lib/helpers/setGeolocation';
import { configureBrowserLaunchArgs } from './lib/helpers/configureBrowserLaunchArgs';
import loadDomOverrides from './lib/loadDomOverrides';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import configureDeviceProfile from './lib/helpers/configureDeviceProfile';
import configureHttp2Session from './lib/helpers/configureHttp2Session';
import lookupPublicIp, { IpLookupServices } from './lib/helpers/lookupPublicIp';
import IUserAgentData from './interfaces/IUserAgentData';
import UserAgentOptions from './lib/UserAgentOptions';
import BrowserEngineOptions from './lib/BrowserEngineOptions';
import IBrowserLaunchArgs from '@unblocked-web/emulator-spec/browser/IBrowserLaunchArgs';
import IBrowser from '@unblocked-web/emulator-spec/browser/IBrowser';
import Log from '@ulixee/commons/lib/Logger';

// Configuration to rotate out the default browser id. Used for testing different browsers via cli
const defaultBrowserId = process.env.HERO_DEFAULT_BROWSER_ID ?? process.env.SA_DEFAULT_BROWSER_ID;

const dataLoader = new DataLoader(__dirname);
const browserEngineOptions = new BrowserEngineOptions(dataLoader, defaultBrowserId);
const userAgentOptions = new UserAgentOptions(dataLoader, browserEngineOptions);

export const defaultBrowserEngine = browserEngineOptions.default;

const { log } = Log(module);

export interface IEmulatorOptions {
  userAgentSelector?: string;
}

@EmulatorPluginClassDecorator
export default class DefaultBrowserEmulator<T = IEmulatorOptions> implements IEmulatorPlugin<T> {
  public readonly logger: IBoundLog;
  public readonly emulatorProfile: IEmulatorProfile<T>;

  public get userAgentString(): string {
    return this.emulatorProfile.userAgentOption.string;
  }

  public get browserEngine(): IBrowserEngine {
    return this.emulatorProfile.browserEngine;
  }

  public get deviceProfile(): IDeviceProfile {
    return this.emulatorProfile.deviceProfile;
  }

  protected readonly data: IBrowserData;
  private readonly domOverridesBuilder: DomOverridesBuilder;
  private readonly userAgentData: IUserAgentData;

  constructor(emulatorProfile: IEmulatorProfile<T>) {
    this.logger = emulatorProfile.logger ?? log.createChild(module);
    this.emulatorProfile = emulatorProfile;
    this.data = dataLoader.as(emulatorProfile.userAgentOption) as any;
    this.userAgentData = this.getUserAgentData();
    // set default device profile options
    emulatorProfile.deviceProfile ??= {};
    configureDeviceProfile(this.deviceProfile);
    this.domOverridesBuilder = loadDomOverrides(this.emulatorProfile, this.data, this.userAgentData);
  }

  configure(emulatorProfile: IEmulatorProfile<T>): void {
    emulatorProfile.locale ??= this.data.browserConfig.defaultLocale;
    emulatorProfile.viewport ??= Viewports.getDefault(
      this.data.windowBaseFraming,
      this.data.windowFraming,
    );
    emulatorProfile.timezoneId ??= Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (emulatorProfile.upstreamProxyUrl) {
      emulatorProfile.upstreamProxyIpMask ??= {};
      emulatorProfile.upstreamProxyIpMask.ipLookupService ??= IpLookupServices.ipify;
    }
  }

  public onDnsConfiguration(settings: IDnsSettings): void {
    configureSessionDns(this.emulatorProfile, settings);
  }

  public onTcpConfiguration(settings: ITcpSettings): void {
    configureSessionTcp(this.emulatorProfile, settings);
  }

  public onTlsConfiguration(settings: ITlsSettings): void {
    configureSessionTls(this.emulatorProfile, settings);
  }

  public beforeHttpRequest(resource: IHttpResourceLoadDetails): void {
    modifyHeaders(this.emulatorProfile, this.data, this.userAgentData, resource);
  }

  public async onHttpAgentInitialized(agent: IHttpSocketAgent): Promise<void> {
    const profile = this.emulatorProfile;
    const upstreamProxyIpMask = profile.upstreamProxyIpMask;
    if (upstreamProxyIpMask) {
      upstreamProxyIpMask.publicIp ??= await lookupPublicIp(upstreamProxyIpMask.ipLookupService);
      upstreamProxyIpMask.proxyIp ??= await lookupPublicIp(
        upstreamProxyIpMask.ipLookupService,
        agent,
        profile.upstreamProxyUrl,
      );
      this.logger.info('PublicIp Lookup', {
        ...upstreamProxyIpMask,
      });
      this.domOverridesBuilder.add('webrtc', {
        localIp: upstreamProxyIpMask.publicIp,
        proxyIp: upstreamProxyIpMask.proxyIp,
      });
    }
  }

  public onHttp2SessionConnect(
    request: IHttpResourceLoadDetails,
    settings: IHttp2ConnectSettings,
  ): void {
    configureHttp2Session(this.emulatorProfile, this.data, request, settings);
  }

  public onNewBrowser(browser: IBrowser, options: IBrowserLaunchArgs): void {
    configureBrowserLaunchArgs(browser.engine, options);
  }

  public onNewPage(page: IPage): Promise<any> {
    // Don't await here! we want to queue all these up to run before the debugger resumes
    const devtools = page.devtoolsSession;
    const emulatorProfile = this.emulatorProfile;
    return Promise.all([
      setUserAgent(emulatorProfile, devtools, this.userAgentData),
      setTimezone(emulatorProfile, devtools),
      setLocale(emulatorProfile, devtools),
      setScreensize(emulatorProfile, page, devtools),
      setActiveAndFocused(emulatorProfile, devtools),
      setPageDomOverrides(this.domOverridesBuilder, this.data, page),
      setGeolocation(emulatorProfile, page),
    ]);
  }

  public onNewWorker(worker: IWorker): Promise<any> {
    const devtools = worker.devtoolsSession;
    return Promise.all([
      setUserAgent(this.emulatorProfile, devtools, this.userAgentData),
      setWorkerDomOverrides(this.domOverridesBuilder, this.data, worker),
    ]);
  }

  protected getUserAgentData(): IUserAgentData {
    if (!this.data.windowNavigator.navigator.userAgentData) return null;
    const { browserVersion, operatingSystemVersion } = this.emulatorProfile.userAgentOption;
    const uaFullVersion = `${browserVersion.major}.0.${browserVersion.patch}.${browserVersion.build}`;
    const platformVersion = `${operatingSystemVersion.major}.${
      operatingSystemVersion.minor ?? '0'
    }.${operatingSystemVersion.build ?? '1'}`;

    const brands = this.data.windowNavigator.navigator.userAgentData.brands;
    const brandData = [brands['0'], brands['1'], brands['2']].map((x) => ({
      brand: x.brand._$value,
      version: x.version._$value,
    }));
    return {
      uaFullVersion,
      brands: brandData,
      platform: this.data.windowNavigator.navigator.userAgentData.platform._$value,
      platformVersion,
    };
  }

  public static shouldActivate(emulatorProfile: IEmulatorProfile<IEmulatorOptions>): boolean {
    if (
      emulatorProfile.userAgentOption &&
      !userAgentOptions.hasDataSupport(emulatorProfile.userAgentOption)
    ) {
      emulatorProfile.logger?.info(
        "DefaultBrowserEmulator doesn't have data file for the provided userAgentOption",
        { userAgentOption: emulatorProfile.userAgentOption },
      );
      return false;
    }

    // assign a browser engine and user agent option if not provided
    if (!emulatorProfile.userAgentOption) {
      try {
        const { browserEngine, userAgentOption } = DefaultBrowserEmulator.selectBrowserMeta(
          emulatorProfile.customEmulatorConfig?.userAgentSelector,
        );
        emulatorProfile.browserEngine = browserEngine;
        emulatorProfile.userAgentOption = userAgentOption;
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  public static selectBrowserMeta(userAgentSelector?: string): {
    browserEngine: IBrowserEngine;
    userAgentOption: IUserAgentOption;
  } {
    const userAgentOption = selectUserAgentOption(userAgentSelector, userAgentOptions);

    const { browserName, browserVersion } = userAgentOption;
    const browserEngineId = `${browserName}-${browserVersion.major}-${browserVersion.minor}`;
    const browserEngineOption = selectBrowserEngineOption(
      browserEngineId,
      dataLoader.browserEngineOptions,
    );

    const browserEngine = new BrowserEngine(browserEngineOption);
    return { browserEngine, userAgentOption };
  }

  public static defaultBrowserEngine(): IBrowserEngine {
    return new BrowserEngine(defaultBrowserEngine);
  }
}
