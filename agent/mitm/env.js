"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envUtils_1 = require("@ulixee/commons/lib/envUtils");
(0, envUtils_1.loadEnv)(__dirname);
const env = process.env;
const envDebug = env.DEBUG ?? '';
if (env.ULX_DATA_DIR)
    env.ULX_DATA_DIR = (0, envUtils_1.parseEnvPath)(env.ULX_DATA_DIR);
if (env.ULX_NETWORK_DIR)
    env.ULX_NETWORK_DIR = (0, envUtils_1.parseEnvPath)(env.ULX_NETWORK_DIR);
exports.default = {
    sslKeylogFile: env.SSLKEYLOGFILE,
    // TODO: this is insecure by default because golang 1.14 has an issue verifying certain certificate authorities:
    // https://github.com/golang/go/issues/24652
    // https://github.com/golang/go/issues/38365
    allowInsecure: (0, envUtils_1.parseEnvBool)(env.ULX_MITM_ALLOW_INSECURE),
    enableMitmCache: (0, envUtils_1.parseEnvBool)(env.ULX_MITM_ENABLED_CACHE),
    defaultStorageDirectory: env.ULX_NETWORK_DIR ?? env.ULX_DATA_DIR,
    isDebug: envDebug.includes('ulx:*') ||
        envDebug.includes('ulx*') ||
        envDebug === '*' ||
        envDebug.includes('ulx:mitm'),
};
//# sourceMappingURL=env.js.map