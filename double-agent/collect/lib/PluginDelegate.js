"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getAllPlugins_1 = require("./getAllPlugins");
class PluginDelegate {
    constructor() {
        this.plugins = (0, getAllPlugins_1.default)(true);
    }
}
exports.default = PluginDelegate;
//# sourceMappingURL=PluginDelegate.js.map