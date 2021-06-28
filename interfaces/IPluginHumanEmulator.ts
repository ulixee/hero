import { IInteractionGroups, IInteractionStep } from './IInteractions';
import { PluginTypes } from './IPluginTypes';
import IInteractionsHelper from './IInteractionsHelper';
import IPoint from './IPoint';
import IPluginCreateOptions from './IPluginCreateOptions';

export interface IHumanEmulatorClass {
  id: string;
  pluginType: PluginTypes.HumanEmulator;
  new (createOptions: IPluginCreateOptions): IHumanEmulator;
}

export interface IHumanEmulator extends IHumanEmulatorMethods {
  id: string;
}

export interface IHumanEmulatorMethods {
  playInteractions?(
    interactions: IInteractionGroups,
    runFn: (interaction: IInteractionStep) => Promise<void>,
    helper?: IInteractionsHelper,
  ): Promise<void>;
  getStartingMousePoint?(helper?: IInteractionsHelper): Promise<IPoint>;
}

// decorator for human emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HumanEmulatorClassDecorator(constructor: IHumanEmulatorClass): void {}
