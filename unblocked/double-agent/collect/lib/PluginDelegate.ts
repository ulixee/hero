import getAllPlugins from './getAllPlugins';
import Plugin from './Plugin';

export default class PluginDelegate {
  readonly plugins: Plugin[];

  constructor() {
    this.plugins = getAllPlugins(true);
  }
}
