import HumanoidBasic from '@secret-agent/humanoid-basic';
import HumanoidSkipper from '@secret-agent/humanoid-skipper';
import HumanoidPlugin from './lib/HumanoidPlugin';
import Utils from './lib/Utils';

type IHumanoidPlugin = new () => HumanoidPlugin;

export default class Humanoids {
  private static readonly pluginsById: { [id: string]: IHumanoidPlugin } = {};

  // tslint:disable-next-line:variable-name
  public static load(EmulatorPlugin: IHumanoidPlugin) {
    // @ts-ignore
    this.pluginsById[EmulatorPlugin.id] = EmulatorPlugin;
  }

  public static create(id: string) {
    return new this.pluginsById[id]();
  }

  public static getRandomId() {
    const pluginIds = Object.keys(this.pluginsById);
    return Utils.pickRandom(pluginIds);
  }
}

export { HumanoidPlugin, Utils };

Humanoids.load(HumanoidBasic);
Humanoids.load(HumanoidSkipper);
