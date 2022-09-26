import IUnblockedPlugin, {
  UnblockedPluginClassDecorator,
} from '@unblocked-web/specifications/plugin/IUnblockedPlugin';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IDeviceProfile from '@unblocked-web/specifications/plugin/IDeviceProfile';
import IBrowserEngine from '@unblocked-web/specifications/agent/browser/IBrowserEngine';
import IUserAgentOption from '@unblocked-web/specifications/plugin/IUserAgentOption';
import IHttpResourceLoadDetails from '@unblocked-web/specifications/agent/net/IHttpResourceLoadDetails';
import IDnsSettings from '@unblocked-web/specifications/agent/net/IDnsSettings';
import ITcpSettings from '@unblocked-web/specifications/agent/net/ITcpSettings';
import ITlsSettings from '@unblocked-web/specifications/agent/net/ITlsSettings';
import { IPage } from '@unblocked-web/specifications/agent/browser/IPage';
import { IWorker } from '@unblocked-web/specifications/agent/browser/IWorker';
import IHttp2ConnectSettings from '@unblocked-web/specifications/agent/net/IHttp2ConnectSettings';
import IHttpSocketAgent from '@unblocked-web/specifications/agent/net/IHttpSocketAgent';
import IBrowserLaunchArgs from '@unblocked-web/specifications/agent/browser/IBrowserLaunchArgs';
import IBrowser from '@unblocked-web/specifications/agent/browser/IBrowser';
import Log from '@ulixee/commons/lib/Logger';
import { IFrame } from '@unblocked-web/specifications/agent/browser/IFrame';
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

// Configuration to rotate out the default browser id. Used for testing different browsers via cli
const defaultBrowserId = process.env.ULX_DEFAULT_BROWSER_ID ?? process.env.UBK_DEFAULT_BROWSER_ID;

const dataLoader = new DataLoader();
const browserEngineOptions = new BrowserEngineOptions(dataLoader, defaultBrowserId);
const userAgentOptions = new UserAgentOptions(dataLoader, browserEngineOptions);

export const defaultBrowserEngine = browserEngineOptions.default;

const { log } = Log(module);

export interface IEmulatorOptions {
  userAgentSelector?: string;
}

@UnblockedPluginClassDecorator
export default class DefaultBrowserEmulator<T = IEmulatorOptions> implements IUnblockedPlugin<T> {
  public readonly logger: IBoundLog;
  public readonly emulationProfile: IEmulationProfile<T>;

  public get userAgentString(): string {
    return this.emulationProfile.userAgentOption.string;
  }

  public get browserEngine(): IBrowserEngine {
    return this.emulationProfile.browserEngine;
  }

  public get deviceProfile(): IDeviceProfile {
    return this.emulationProfile.deviceProfile;
  }

  protected readonly data: IBrowserData;
  private readonly domOverridesBuilder: DomOverridesBuilder;
  private readonly userAgentData: IUserAgentData;

  constructor(emulationProfile: IEmulationProfile<T>) {
    this.logger = emulationProfile.logger ?? log.createChild(module);
    this.emulationProfile = emulationProfile;
    this.data = dataLoader.as(emulationProfile.userAgentOption) as any;
    this.userAgentData = this.getUserAgentData();
    // set default device profile options
    emulationProfile.deviceProfile ??= {};
    configureDeviceProfile(this.deviceProfile);
    this.domOverridesBuilder = loadDomOverrides(
      this.emulationProfile,
      this.data,
      this.userAgentData,
    );
  }

  configure(emulationProfile: IEmulationProfile<T>): void {
    emulationProfile.locale ??= this.data.browserConfig.defaultLocale;
    emulationProfile.viewport ??= Viewports.getDefault(
      this.data.windowBaseFraming,
      this.data.windowFraming,
    );
    emulationProfile.timezoneId ??= Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (emulationProfile.upstreamProxyUrl) {
      emulationProfile.upstreamProxyIpMask ??= {};
      emulationProfile.upstreamProxyIpMask.ipLookupService ??= IpLookupServices.ipify;
    }
  }

  public onDnsConfiguration(settings: IDnsSettings): void {
    configureSessionDns(this.emulationProfile, settings);
  }

  public onTcpConfiguration(settings: ITcpSettings): void {
    configureSessionTcp(this.emulationProfile, settings);
  }

  public onTlsConfiguration(settings: ITlsSettings): void {
    configureSessionTls(this.emulationProfile, settings);
  }

  public beforeHttpRequest(resource: IHttpResourceLoadDetails): void {
    modifyHeaders(this.emulationProfile, this.data, this.userAgentData, resource);
  }

  public async onHttpAgentInitialized(agent: IHttpSocketAgent): Promise<void> {
    const profile = this.emulationProfile;
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
    configureHttp2Session(this.emulationProfile, this.data, request, settings);
  }

  public onNewBrowser(browser: IBrowser, options: IBrowserLaunchArgs): void {
    configureBrowserLaunchArgs(browser.engine, options);
  }

  public addDomOverride(
    runOn: 'page' | 'worker',
    script: string,
    args: Record<string, any> & { callbackName?: string },
    callback?: (data: string, frame: IFrame) => any,
  ): boolean {
    if (runOn === 'page') {
      this.domOverridesBuilder.addPageScript(script, args, callback);
    } else {
      if (callback) {
        throw new Error("Sorry, we can't add a callback function to a Worker environment.");
      }
      this.domOverridesBuilder.addWorkerScript(script, args);
    }
    return true;
  }

  public onNewPage(page: IPage): Promise<any> {
    // Don't await here! we want to queue all these up to run before the debugger resumes
    const devtools = page.devtoolsSession;
    const emulationProfile = this.emulationProfile;
    return Promise.all([
      setUserAgent(emulationProfile, devtools, this.userAgentData),
      setTimezone(emulationProfile, devtools),
      setLocale(emulationProfile, devtools),
      setScreensize(emulationProfile, page, devtools),
      setActiveAndFocused(emulationProfile, devtools),
      setPageDomOverrides(this.domOverridesBuilder, this.data, page),
      setGeolocation(emulationProfile, page),
    ]);
  }

  public onNewWorker(worker: IWorker): Promise<any> {
    const devtools = worker.devtoolsSession;
    return Promise.all([
      setUserAgent(this.emulationProfile, devtools, this.userAgentData),
      setWorkerDomOverrides(this.domOverridesBuilder, this.data, worker),
    ]);
  }

  protected getUserAgentData(): IUserAgentData {
    if (!this.data.windowNavigator.navigator.userAgentData) return null;
    const { browserVersion, operatingSystemVersion } = this.emulationProfile.userAgentOption;
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
      architecture: 'x86',
      model: '',
      mobile: false,
      wow64: false,
    };
  }

  public static shouldActivate(emulationProfile: IEmulationProfile<IEmulatorOptions>): boolean {
    if (
      emulationProfile.userAgentOption &&
      !userAgentOptions.hasDataSupport(emulationProfile.userAgentOption)
    ) {
      emulationProfile.logger?.info(
        "DefaultBrowserEmulator doesn't have data file for the provided userAgentOption",
        { userAgentOption: emulationProfile.userAgentOption },
      );
      return false;
    }

    // assign a browser engine and user agent option if not provided
    if (!emulationProfile.userAgentOption) {
      try {
        const { browserEngine, userAgentOption } = DefaultBrowserEmulator.selectBrowserMeta(
          emulationProfile.customEmulatorConfig?.userAgentSelector,
        );
        emulationProfile.browserEngine = browserEngine;
        emulationProfile.userAgentOption = userAgentOption;
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

  public static default(): IBrowserEngine {
    return new BrowserEngine(defaultBrowserEngine);
  }
}
