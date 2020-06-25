import HumanoidPlugin from './lib/HumanoidPlugin';
import Utils from './lib/Utils';
import HumanoidBasic from '@secret-agent/humanoid-basic';
import HumanoidSkipper from '@secret-agent/humanoid-skipper';

type IHumanoidPlugin = new () => HumanoidPlugin;

export default class Humanoids {
  private static readonly pluginsByKey: { [key: string]: IHumanoidPlugin } = {};

  // tslint:disable-next-line:variable-name
  public static load(EmulatorPlugin: IHumanoidPlugin) {
    // @ts-ignore
    this.pluginsByKey[EmulatorPlugin.key] = EmulatorPlugin;
  }

  public static get(key: string) {
    return new this.pluginsByKey[key]();
  }

  public static getRandom(): HumanoidPlugin {
    const plugins = Object.values(this.pluginsByKey);
    const plugin = Utils.pickRandom(plugins);
    return new plugin();
  }
}

export { HumanoidPlugin, Utils };

Humanoids.load(HumanoidBasic);
Humanoids.load(HumanoidSkipper);
