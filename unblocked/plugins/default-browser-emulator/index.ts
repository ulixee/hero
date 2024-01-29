import IUnblockedPlugin, {
  UnblockedPluginClassDecorator,
} from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import IUserAgentOption from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IDnsSettings from '@ulixee/unblocked-specification/agent/net/IDnsSettings';
import ITcpSettings from '@ulixee/unblocked-specification/agent/net/ITcpSettings';
import ITlsSettings from '@ulixee/unblocked-specification/agent/net/ITlsSettings';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import { IWorker } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import IHttp2ConnectSettings from '@ulixee/unblocked-specification/agent/net/IHttp2ConnectSettings';
import IHttpSocketAgent from '@ulixee/unblocked-specification/agent/net/IHttpSocketAgent';
import IBrowserUserConfig from '@ulixee/unblocked-specification/agent/browser/IBrowserUserConfig';
import IBrowser from '@ulixee/unblocked-specification/agent/browser/IBrowser';
import Log from '@ulixee/commons/lib/Logger';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
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
import lookupPublicIp from './lib/helpers/lookupPublicIp';
import IUserAgentData from './interfaces/IUserAgentData';
import UserAgentOptions from './lib/UserAgentOptions';
import BrowserEngineOptions from './lib/BrowserEngineOptions';

// Configuration to rotate out the default browser id. Used for testing different browsers via cli
const defaultBrowserId = process.env.ULX_DEFAULT_BROWSER_ID;

const dataLoader = new DataLoader();
const browserEngineOptions = new BrowserEngineOptions(dataLoader, defaultBrowserId);
const userAgentOptions = new UserAgentOptions(dataLoader, browserEngineOptions);

export const defaultBrowserEngine = browserEngineOptions.default;

const { log } = Log(module);

export interface IEmulatorOptions {
  userAgentSelector?: string;
}

let hasWarnedAboutProxyIp = false;

@UnblockedPluginClassDecorator
export default class DefaultBrowserEmulator<T = IEmulatorOptions> implements IUnblockedPlugin<T> {
  // Should the system attempt to manipulate tcp settings to match the emulated OS. NOTE that this can affect tcp performance.
  public static enableTcpEmulation = false;
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

  protected get domOverridesBuilder(): DomOverridesBuilder {
    this.#domOverridesBuilder ??= loadDomOverrides(
      this.emulationProfile,
      this.data,
      this.userAgentData,
    );
    return this.#domOverridesBuilder;
  }

  protected readonly data: IBrowserData;
  private readonly userAgentData: IUserAgentData;

  #domOverridesBuilder: DomOverridesBuilder;

  constructor(emulationProfile: IEmulationProfile<T>) {
    this.logger = emulationProfile.logger ?? log.createChild(module);
    this.emulationProfile = emulationProfile;
    this.data = dataLoader.as(emulationProfile.userAgentOption) as any;
    this.userAgentData = this.getUserAgentData();
    // set default device profile options
    emulationProfile.deviceProfile ??= {};
    configureDeviceProfile(this.deviceProfile);
  }

  configure(emulationProfile: IEmulationProfile<T>): void {
    emulationProfile.windowNavigatorPlatform ??=
      this.data.windowNavigator.navigator.platform._$value;
    emulationProfile.locale ??= this.data.browserConfig.defaultLocale;
    emulationProfile.viewport ??= Viewports.getDefault(
      this.data.windowBaseFraming,
      this.data.windowFraming,
    );
    this.deviceProfile.viewport = emulationProfile.viewport;
    emulationProfile.timezoneId ??= Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (emulationProfile.upstreamProxyUrl && !emulationProfile.upstreamProxyIpMask) {
      if (!hasWarnedAboutProxyIp) {
        hasWarnedAboutProxyIp = true;
        console.warn(
          "You're using an upstreamProxyUrl without a Proxy IP Mask. This can expose the public IP of your host machine via WebRTC leaks in Chrome. To resolve, you can use the upstreamProxyIpMask feature.",
        );
      }
    }

    emulationProfile.browserEngine.isHeaded = emulationProfile.options.showChrome;
  }

  public onDnsConfiguration(settings: IDnsSettings): void {
    configureSessionDns(this.emulationProfile, settings);
  }

  public onTcpConfiguration(settings: ITcpSettings): void {
    if (DefaultBrowserEmulator.enableTcpEmulation) {
      configureSessionTcp(this.emulationProfile, settings);
    }
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
    if (upstreamProxyIpMask && profile.upstreamProxyUrl) {
      upstreamProxyIpMask.publicIp ??= await lookupPublicIp(upstreamProxyIpMask.ipLookupService);
      upstreamProxyIpMask.proxyIp ??= await lookupPublicIp(
        upstreamProxyIpMask.ipLookupService,
        agent,
        profile.upstreamProxyUrl,
      );
      if (upstreamProxyIpMask.proxyIp === upstreamProxyIpMask.publicIp) {
        this.logger.error(
          'upstreamProxyIpMask Lookup showing same IP for Proxy and Machine IP. Please check these settings.',
          {
            ...upstreamProxyIpMask,
          },
        );
        return;
      }
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

  public onNewBrowser(browser: IBrowser, options: IBrowserUserConfig): void {
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

  public onClose(): void {
    this.#domOverridesBuilder?.cleanup();
    this.#domOverridesBuilder = null;
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

  public onNewFrameProcess(frame: IFrame): Promise<any> {
    // Don't await here! we want to queue all these up to run before the debugger resumes
    const devtools = frame.devtoolsSession;
    const emulationProfile = this.emulationProfile;
    return Promise.all([
      setUserAgent(emulationProfile, devtools, this.userAgentData),
      setTimezone(emulationProfile, devtools),
      setLocale(emulationProfile, devtools),
      setPageDomOverrides(this.domOverridesBuilder, this.data, frame.page, frame.devtoolsSession),
      setGeolocation(emulationProfile, frame),
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
    const { browserVersion, uaClientHintsPlatformVersion } = this.emulationProfile.userAgentOption;
    const uaFullVersion = `${browserVersion.major}.0.${browserVersion.build}.${browserVersion.patch}`;

    const brands = this.data.windowNavigator.navigator.userAgentData.brands;
    const brandData = [brands['0'], brands['1'], brands['2']].map(x => ({
      brand: x.brand._$value,
      version: x.version._$value,
    }));
    const fullVersionList = brandData.map(x => ({
      brand: x.brand,
      version:
        x.brand === 'Chromium' || x.brand === 'Chrome' ? uaFullVersion : `${x.version}.0.0.0`,
    }));
    return {
      uaFullVersion,
      brands: brandData,
      fullVersionList,
      platform: this.data.windowNavigator.navigator.userAgentData.platform._$value,
      platformVersion: uaClientHintsPlatformVersion,
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
        if (emulationProfile.customEmulatorConfig?.userAgentSelector) {
          emulationProfile.logger?.error('Failed to instantiate a default browser engine.', {
            error: e,
          });
        }
        return false;
      }
    }
    if (emulationProfile.userAgentOption && !emulationProfile.browserEngine) {
      try {
        emulationProfile.browserEngine = DefaultBrowserEmulator.getBrowserEngine(
          emulationProfile.userAgentOption,
        );
      } catch (e) {
        emulationProfile.logger?.error(
          'Failed to get a browser engine for the configured userAgentOption',
          {
            error: e,
            userAgentOption: emulationProfile.userAgentOption,
          },
        );
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

    const browserEngine = this.getBrowserEngine(userAgentOption);

    return { browserEngine, userAgentOption };
  }

  public static getBrowserEngine(userAgentOption: IUserAgentOption): IBrowserEngine {
    const { browserName, browserVersion } = userAgentOption;
    const browserEngineId = `${browserName}-${browserVersion.major}-${browserVersion.minor}`;
    const browserEngineOption = selectBrowserEngineOption(
      browserEngineId,
      dataLoader.browserEngineOptions,
    );

    if (!browserEngineOption) throw new Error(`Unable to load BrowserEngine (${browserEngineId})`);

    return new BrowserEngine(browserEngineOption);
  }

  public static default(): IBrowserEngine {
    return new BrowserEngine(defaultBrowserEngine);
  }
}
