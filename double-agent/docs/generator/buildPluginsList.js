"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildPluginsList;
const Fs = require("fs");
const Path = require("path");
const getAllPlugins_1 = require("@double-agent/collect/lib/getAllPlugins");
const getAllPlugins_2 = require("@double-agent/analyze/lib/getAllPlugins");
const paths_1 = require("../paths");
const header = `Name | Description
--- | :---`;
function buildPluginsList(pluginType) {
    const outputFile = Path.resolve(paths_1.outputDir, `${pluginType}-plugins.md`);
    const getAllPlugins = pluginType === 'collect' ? getAllPlugins_1.default : getAllPlugins_2.default;
    const allPlugins = getAllPlugins(true);
    let md = header;
    for (const plugin of allPlugins) {
        md += `\n${plugin.id} | ${plugin.summary}`;
    }
    Fs.writeFileSync(outputFile, md);
}
//# sourceMappingURL=buildPluginsList.js.map