import * as Fs from 'fs';
import * as Path from 'path';
import Plugin from './Plugin';
import IPlugin from '../interfaces/IPlugin';

export const pluginsDir = Path.resolve(__dirname, '../plugins');

export default function getAllPlugins(print = false, filter?: string[]): Plugin[] {
  const plugins: Plugin[] = [];

  for (const pluginDirName of Fs.readdirSync(pluginsDir)) {
    const pluginDir = Path.join(pluginsDir, pluginDirName);
    const packageJsonPath = Path.join(pluginDir, 'package.json');
    if (pluginDirName === '.DS_Store') continue;
    if (!Fs.statSync(pluginDir).isDirectory()) continue;
    if (filter && !filter.includes(pluginDirName)) continue;
    // if (pluginDirName !== 'http-assets') continue;
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const CollectPlugin = require(pluginDir)?.default;
      if (!CollectPlugin) continue;
      if (!Fs.existsSync(packageJsonPath)) continue;
      // eslint-disable-next-line global-require,import/no-dynamic-require
      const pkg = require(packageJsonPath);
      if (pkg.disabled) continue;
      plugins.push(new CollectPlugin(pluginDir));
    } catch (err) {
      console.log(err);
    }
  }

  const sortedPlugins = [...plugins];
  for (const plugin of plugins as IPlugin[]) {
    if (plugin.changePluginOrder) {
      plugin.changePluginOrder(sortedPlugins);
    }
  }

  if (print) {
    console.log(
      'Collect Plugins Activated',
      sortedPlugins.map((x) => `${x ? '✓' : 'x'} ${x.id} - ${x.summary}`),
    );
  }

  return sortedPlugins;
}
