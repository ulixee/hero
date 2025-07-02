"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const envUtils_1 = require("@ulixee/commons/lib/envUtils");
const Path = require("path");
(0, envUtils_1.loadEnv)(Path.resolve(__dirname, '..'));
const { env } = process;
exports.default = {
    browserStackUser: env.BROWSERSTACK_USER,
    browserStackKey: env.BROWSERSTACK_ACCESS_KEY,
    browserStackLocal: (0, envUtils_1.parseEnvBool)(env.BROWSERSTACK_LOCAL),
};
//# sourceMappingURL=env.js.map