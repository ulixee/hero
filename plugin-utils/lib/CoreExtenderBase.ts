import { IBoundLog } from "@secret-agent/interfaces/ILog";
import {
  CoreExtenderClassDecorator,
  ICoreExtender,
  ICoreExtenderClass
} from "@secret-agent/interfaces/IPluginCoreExtender";
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import IPluginCreateOptions from "@secret-agent/interfaces/IPluginCreateOptions";
import IBrowserEngine from "@secret-agent/interfaces/IBrowserEngine";
import IPlugins from "@secret-agent/interfaces/IPlugins";

@CoreExtenderClassDecorator
export default class CoreExtenderBase implements ICoreExtender {
  public static id: string;
  public static pluginType: PluginTypes.CoreExtender = PluginTypes.CoreExtender;

  public readonly id: string;

  protected readonly browserEngine: IBrowserEngine;
  protected readonly plugins: IPlugins;
  protected readonly logger: IBoundLog;

  constructor({ browserEngine, plugins, logger }: IPluginCreateOptions) {
    this.id = (this.constructor as ICoreExtenderClass).id as string;
    this.browserEngine = browserEngine;
    this.plugins = plugins;
    this.logger = logger;
  }
}
