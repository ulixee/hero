"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requirePlugins;
const extractPlugins_1 = require("./extractPlugins");
const filterPlugins_1 = require("./filterPlugins");
const byPath = {};
function requirePlugins(path, pluginType) {
    if (!byPath[path]) {
        byPath[path] = [];
        // eslint-disable-next-line global-require,import/no-dynamic-require
        byPath[path] = (0, extractPlugins_1.default)(require(path));
    }
    return (pluginType ? (0, filterPlugins_1.default)(byPath[path], pluginType) : byPath[path]);
}
//# sourceMappingURL=requirePlugins.js.map