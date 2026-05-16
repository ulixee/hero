"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buildPluginsList_1 = require("./buildPluginsList");
const buildReadme_1 = require("./buildReadme");
(async function generate() {
    await (0, buildPluginsList_1.default)('collect');
    await (0, buildPluginsList_1.default)('analyze');
    await (0, buildReadme_1.default)();
})().catch(console.error);
//# sourceMappingURL=index.js.map