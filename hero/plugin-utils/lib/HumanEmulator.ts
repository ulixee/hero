import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import {
  HumanEmulatorClassDecorator,
  IHumanEmulator,
  IHumanEmulatorClass,
} from '@secret-agent/interfaces/ICorePlugin';
import ICorePluginCreateOptions from '@secret-agent/interfaces/ICorePluginCreateOptions';

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
