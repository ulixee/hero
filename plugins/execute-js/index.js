"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorePlugin = exports.ClientPlugin = void 0;
const ClientPlugin_1 = require("./lib/ClientPlugin");
exports.ClientPlugin = ClientPlugin_1.default;
const CorePlugin_1 = require("./lib/CorePlugin");
exports.CorePlugin = CorePlugin_1.default;
exports.default = { ClientPlugin: ClientPlugin_1.default, CorePlugin: CorePlugin_1.default };
//# sourceMappingURL=index.js.map