"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extractPlugins;
const IPluginTypes_1 = require("@ulixee/hero-interfaces/IPluginTypes");
function extractPlugins(obj, pluginType) {
    const Plugins = [];
    if (!obj)
        return Plugins;
    if (isPluginMatch(obj, pluginType)) {
        Plugins.push(obj);
        return Plugins;
    }
    const PotentialPlugins = Array.isArray(obj) ? obj : Object.values(obj);
    for (const PotentialPlugin of PotentialPlugins) {
        if (!PotentialPlugin)
            continue;
        if (isPluginMatch(PotentialPlugin, pluginType)) {
            Plugins.push(PotentialPlugin);
        }
    }
    return Plugins;
}
function isPluginMatch(PotentialPlugin, pluginType) {
    if (pluginType) {
        return PotentialPlugin.type === pluginType;
    }
    if (PotentialPlugin.type === IPluginTypes_1.PluginTypes.ClientPlugin)
        return true;
    if (PotentialPlugin.type === IPluginTypes_1.PluginTypes.CorePlugin)
        return true;
    return false;
}
//# sourceMappingURL=extractPlugins.js.map