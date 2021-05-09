import BrowserEmulatorBase from '@secret-agent/plugin-utils/lib/BrowserEmulatorBase';
import IHttpResourceLoadDetails from '@secret-agent/interfaces/IHttpResourceLoadDetails';
import IDnsSettings from '@secret-agent/interfaces/IDnsSettings';
import ITcpSettings from '@secret-agent/interfaces/ITcpSettings';
import ITlsSettings from '@secret-agent/interfaces/ITlsSettings';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import {
  BrowserEmulatorClassDecorator,
  IBrowserEmulatorConfig,
} from '@secret-agent/interfaces/IPluginBrowserEmulator';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import IViewport from '@secret-agent/interfaces/IViewport';
import IPluginCreateOptions from '@secret-agent/interfaces/IPluginCreateOptions';
import IUserAgentOption from '@secret-agent/interfaces/IUserAgentOption';
import BrowserEngine from '@secret-agent/plugin-utils/lib/BrowserEngine';
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
import selectBrowserEngineOption from "./lib/helpers/selectBrowserEngineOption";

const dataLoader = new DataLoader(__dirname);
export const latestBrowserEngineId = 'chrome-88-0';
export const latestChromeBrowserVersion = { major: '88', minor: '0' };

@BrowserEmulatorClassDecorator
export default class DefaultBrowserEmulator extends BrowserEmulatorBase {
  public static id = dataLoader.pkg.name.replace('@secret-agent/', '');

  public timezoneId: string;
  public locale: string;
  public viewport: IViewport;

  protected readonly data: IBrowserData;

  constructor(createOptions: IPluginCreateOptions, userAgentOption: IUserAgentOption) {
    super(createOptions, userAgentOption);
    this.data = dataLoader.as(userAgentOption);

    if (this.data.browserConfig.features.includes('FirstPartyCookies')) {
      createOptions.plugins.use(FirstPartyCookiesPlugin);
    }
  }

  configure(config: IBrowserEmulatorConfig) {
    if (!config) return;

    config.locale = config.locale || this.locale || this.data.browserConfig.defaultLocale;
    config.viewport =
      config.viewport ||
      this.viewport ||
      Viewports.getDefault(this.data.windowBaseFraming, this.data.windowFraming);
    config.timezoneId =
      config.timezoneId || this.timezoneId || Intl.DateTimeFormat().resolvedOptions().timeZone;

    this.locale = config.locale;
    this.viewport = config.viewport;
    this.timezoneId = config.timezoneId;
  }

  public async onDnsConfiguration(settings: IDnsSettings): Promise<void> {
    configureSessionDns(this, settings);
  }

  public async onTcpConfiguration(settings: ITcpSettings): Promise<void> {
    configureSessionTcp(this, settings);
  }

  public async onTlsConfiguration(settings: ITlsSettings): Promise<void> {
    configureSessionTls(this, settings);
  }

  public async beforeHttpRequest(resource: IHttpResourceLoadDetails): Promise<void> {
    modifyHeaders(this, this.data, resource);
  }

  public onNewPuppetPage(page: IPuppetPage): Promise<any> {
    // Don't await here! we want to queue all these up to run before the debugger resumes
    const devtools = page.devtoolsSession;
    return Promise.all([
      setUserAgent(this, devtools),
      setTimezone(this, devtools),
      setLocale(this, devtools),
      setScreensize(this, devtools),
      setActiveAndFocused(this, devtools),
      // setPageDomOverrides(this, this.data, page),
    ]);
  }

  public onNewPuppetWorker(worker: IPuppetWorker): Promise<any> {
    const devtools = worker.devtoolsSession;
    return Promise.all([
      setUserAgent(this, devtools),
      // setWorkerDomOverrides(this, this.data, worker),
    ]);
  }

  public static selectBrowserMeta(userAgentSelector?: string) {
    const userAgentOption = selectUserAgentOption(userAgentSelector, dataLoader.userAgentOptions);
    const { browserName, browserVersion } = userAgentOption;
    const browserEngineId = `${browserName}-${browserVersion.major}-${browserVersion.minor}`
    const browserEngineOption = selectBrowserEngineOption(browserEngineId, dataLoader.browserEngineOptions);
    const browserEngine = new BrowserEngine(dataLoader.pkg.name, browserEngineOption);
    return { browserEngine, userAgentOption };
  }
}
