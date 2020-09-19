import HumanoidBasic from '@secret-agent/humanoid-basic';
import HumanoidSkipper from '@secret-agent/humanoid-skipper';
import HumanoidPlugin from './lib/HumanoidPlugin';
import Utils from './lib/Utils';
import { IHumanoidPluginStatics } from './HumanoidPluginStatics';

export default class Humanoids {
  private static readonly pluginsById: { [id: string]: IHumanoidPluginStatics } = {};

  public static load(HumanoidPluginImpl: IHumanoidPluginStatics) {
    this.pluginsById[HumanoidPluginImpl.id] = HumanoidPluginImpl;
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
