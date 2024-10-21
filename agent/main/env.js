"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envUtils_1 = require("@ulixee/commons/lib/envUtils");
(0, envUtils_1.loadEnv)(__dirname);
const env = process.env;
const pkgJson = require('./package.json');
exports.default = {
    disableMitm: (0, envUtils_1.parseEnvBool)(env.ULX_DISABLE_MITM),
    showChrome: (0, envUtils_1.parseEnvBool)(env.ULX_SHOW_CHROME),
    noChromeSandbox: (0, envUtils_1.parseEnvBool)(env.ULX_NO_CHROME_SANDBOX),
    useRemoteDebuggingPort: (0, envUtils_1.parseEnvBool)(env.ULX_USE_REMOTE_DEBUGGING_PORT),
    disableGpu: (0, envUtils_1.parseEnvBool)(env.ULX_DISABLE_GPU),
    defaultChromeId: env.ULX_DEFAULT_BROWSER_ID ||
        Object.keys(pkgJson.dependencies)
            .find(x => x.match(/^@ulixee\/chrome-\d+-0$/))
            ?.split('@ulixee/')
            ?.pop(),
    useRosettaChromeOnMac: (0, envUtils_1.parseEnvBool)(env.ULX_USE_CHROME_ROSETTA),
};
//# sourceMappingURL=env.js.map