import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import {
  HumanEmulatorClassDecorator,
  IHumanEmulator,
  IHumanEmulatorClass,
} from '@secret-agent/interfaces/IPluginHumanEmulator';
import IPluginCreateOptions from '@secret-agent/interfaces/IPluginCreateOptions';

@HumanEmulatorClassDecorator
export default class HumanEmulatorBase implements IHumanEmulator {
  public static readonly id: string;
  public static readonly pluginType = PluginTypes.HumanEmulator;

  public readonly id: string;

  private readonly logger: IBoundLog;

  constructor({ logger }: IPluginCreateOptions) {
    this.id = (this.constructor as IHumanEmulatorClass).id;
    this.logger = logger;
  }
}
