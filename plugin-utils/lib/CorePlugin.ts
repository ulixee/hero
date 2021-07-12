import { IBoundLog } from '@secret-agent/interfaces/ILog';
import ICorePlugin, {
  CorePluginClassDecorator,
  ICorePluginClass,
} from '@secret-agent/interfaces/ICorePlugin';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import ICorePluginCreateOptions from '@secret-agent/interfaces/ICorePluginCreateOptions';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import ICorePlugins from '@secret-agent/interfaces/ICorePlugins';

@CorePluginClassDecorator
export default class CorePlugin implements ICorePlugin {
  public static id: string;
  public static type: PluginTypes.CorePlugin = PluginTypes.CorePlugin;

  public readonly id: string;

  protected readonly browserEngine: IBrowserEngine;
  protected readonly plugins: ICorePlugins;
  protected readonly logger: IBoundLog;

  constructor({ browserEngine, corePlugins, logger }: ICorePluginCreateOptions) {
    this.id = (this.constructor as ICorePluginClass).id;
    this.browserEngine = browserEngine;
    this.plugins = corePlugins;
    this.logger = logger;
  }
}
