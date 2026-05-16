"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = filterPlugins;
function filterPlugins(Plugins, pluginType) {
    return Plugins.filter(x => x.type === pluginType);
}
//# sourceMappingURL=filterPlugins.js.map