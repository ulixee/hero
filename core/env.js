"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("@ulixee/unblocked-agent/env");
const envUtils_1 = require("@ulixee/commons/lib/envUtils");
(0, envUtils_1.loadEnv)(__dirname);
const env = process.env;
if (env.ULX_DATA_DIR)
    env.ULX_DATA_DIR = (0, envUtils_1.parseEnvPath)(env.ULX_DATA_DIR);
exports.default = {
    disableMitm: (0, envUtils_1.parseEnvBool)(env.ULX_DISABLE_MITM) ?? env_1.default.disableMitm,
    showChrome: (0, envUtils_1.parseEnvBool)(env.ULX_SHOW_CHROME) ?? env_1.default.showChrome,
    noChromeSandbox: (0, envUtils_1.parseEnvBool)(env.ULX_NO_CHROME_SANDBOX) ?? env_1.default.noChromeSandbox,
    disableGpu: (0, envUtils_1.parseEnvBool)(env.ULX_DISABLE_GPU) ?? env_1.default.disableGpu,
    enableSqliteWal: (0, envUtils_1.parseEnvBool)(env.ULX_ENABLE_SQLITE_WAL) ?? false,
    disableSessionPersistence: (0, envUtils_1.parseEnvBool)(env.ULX_DISABLE_SESSION_PERSISTENCE),
    dataDir: env.ULX_DATA_DIR,
};
//# sourceMappingURL=env.js.map