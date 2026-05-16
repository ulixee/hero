"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginsDir = void 0;
exports.default = getAllPlugins;
const Fs = require("fs");
const Path = require("path");
exports.pluginsDir = Path.resolve(__dirname, '../plugins');
function getAllPlugins(print = false, filter) {
    const plugins = [];
    for (const pluginDirName of Fs.readdirSync(exports.pluginsDir)) {
        const pluginDir = Path.join(exports.pluginsDir, pluginDirName);
        const packageJsonPath = Path.join(pluginDir, 'package.json');
        if (pluginDirName === '.DS_Store')
            continue;
        if (!Fs.statSync(pluginDir).isDirectory())
            continue;
        if (filter && !filter.includes(pluginDirName))
            continue;
        // if (pluginDirName !== 'http-assets') continue;
        try {
            // eslint-disable-next-line global-require,import/no-dynamic-require
            const CollectPlugin = require(pluginDir)?.default;
            if (!CollectPlugin)
                continue;
            if (!Fs.existsSync(packageJsonPath))
                continue;
            // eslint-disable-next-line global-require,import/no-dynamic-require
            const pkg = require(packageJsonPath);
            if (pkg.disabled)
                continue;
            plugins.push(new CollectPlugin(pluginDir));
        }
        catch (err) {
            console.log(err);
        }
    }
    const sortedPlugins = [...plugins];
    for (const plugin of plugins) {
        if (plugin.changePluginOrder) {
            plugin.changePluginOrder(sortedPlugins);
        }
    }
    if (print) {
        console.log('Collect Plugins Activated', sortedPlugins.map((x) => `${x ? '✓' : 'x'} ${x.id} - ${x.summary}`));
    }
    return sortedPlugins;
}
//# sourceMappingURL=getAllPlugins.js.map