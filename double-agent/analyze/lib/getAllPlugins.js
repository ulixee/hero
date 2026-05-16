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
        if (pluginDirName === '.DS_Store')
            continue;
        if (!Fs.statSync(pluginDir).isDirectory())
            continue;
        if (filter && !filter.includes(pluginDirName))
            continue;
        // if (pluginDirName !== 'browser-fingerprints') continue;
        try {
            // eslint-disable-next-line global-require,import/no-dynamic-require
            const AnalyzePlugin = require(pluginDir)?.default;
            if (AnalyzePlugin) {
                plugins.push(new AnalyzePlugin(pluginDir));
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    if (print) {
        console.log('Analyze Plugins Activated', plugins.map(x => `${x ? '✓' : 'x'} ${x.id} - ${x.summary}`));
    }
    return plugins;
}
//# sourceMappingURL=getAllPlugins.js.map