import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ICorePlugin, {
  CorePluginClassDecorator,
  ICorePluginClass,
  ISessionSummary,
} from '@ulixee/hero-interfaces/ICorePlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';
import IBrowserEngine from '@unblocked-web/emulator-spec/browser/IBrowserEngine';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';

@CorePluginClassDecorator
export default class CorePlugin implements ICorePlugin {
  public static id: string;
  public static type = PluginTypes.CorePlugin;

  public readonly id: string;
  public readonly sessionSummary: ISessionSummary;

  protected readonly browserEngine: IBrowserEngine;
  protected readonly plugins: ICorePlugins;
  protected readonly logger: IBoundLog;

  constructor({ browserEngine, corePlugins, logger, sessionSummary }: ICorePluginCreateOptions) {
    this.id = (this.constructor as ICorePluginClass).id;
    this.browserEngine = browserEngine;
    this.plugins = corePlugins;
    this.logger = logger;
    this.sessionSummary = sessionSummary ?? { id: undefined, options: {} };
  }
}
