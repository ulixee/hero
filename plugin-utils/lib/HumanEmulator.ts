import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import {
  HumanEmulatorClassDecorator,
  IHumanEmulator,
  IHumanEmulatorClass,
} from '@ulixee/hero-interfaces/ICorePlugin';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';

@HumanEmulatorClassDecorator
export default class HumanEmulator implements IHumanEmulator {
  public static readonly id: string;
  public static readonly type = PluginTypes.HumanEmulator;

  public readonly id: string;

  private readonly logger: IBoundLog;

  constructor({ logger }: ICorePluginCreateOptions) {
    this.id = (this.constructor as IHumanEmulatorClass).id;
    this.logger = logger;
  }
}
