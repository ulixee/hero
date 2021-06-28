import { IBoundLog } from '@secret-agent/interfaces/ILog';
import {
  BrowserEmulatorClassDecorator,
  IBrowserEmulator,
  IBrowserEmulatorClass,
  ISelectBrowserMeta,
} from '@secret-agent/interfaces/IPluginBrowserEmulator';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import IPluginCreateOptions from '@secret-agent/interfaces/IPluginCreateOptions';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import IPlugins from '@secret-agent/interfaces/IPlugins';
import IUserAgentOption, { IVersion } from '@secret-agent/interfaces/IUserAgentOption';

@BrowserEmulatorClassDecorator
export default class BrowserEmulatorBase implements IBrowserEmulator {
  public static readonly id: string;
  public static readonly pluginType = PluginTypes.BrowserEmulator;

  public readonly id: string;

  public readonly browserName: string;
  public readonly browserVersion: IVersion;

  public readonly operatingSystemName: string;
  public readonly operatingSystemVersion: IVersion;
  public readonly operatingSystemPlatform: string;

  public readonly userAgentString: string;
  public readonly browserEngine: IBrowserEngine;
  public readonly logger: IBoundLog;

  protected readonly plugins: IPlugins;

  constructor(
    { browserEngine, plugins, logger }: IPluginCreateOptions,
    userAgentOption: IUserAgentOption,
  ) {
    // @ts-ignore
    this.id = (this.constructor as IBrowserEmulatorClass).id;

    this.browserName = userAgentOption.browserName;
    this.browserVersion = userAgentOption.browserVersion;

    this.operatingSystemPlatform = userAgentOption.operatingSystemPlatform;
    this.operatingSystemName = userAgentOption.operatingSystemName;
    this.operatingSystemVersion = userAgentOption.operatingSystemVersion;

    this.userAgentString = userAgentOption.string;
    this.browserEngine = browserEngine;

    this.plugins = plugins;
    this.logger = logger;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static selectBrowserMeta(userAgentSelector: string): ISelectBrowserMeta {
    throw new Error('selectBrowserMeta() is missing implementation');
  }
}
