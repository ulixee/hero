import { loadEnv, parseEnvBool } from '@ulixee/commons/lib/envUtils';

loadEnv(__dirname);
const env = process.env;
const pkgJson = require('./package.json');

export default {
  disableMitm: parseEnvBool(env.UBK_MITM_DISABLE),
  showChrome: parseEnvBool(env.UBK_SHOW_CHROME),
  disableDevtools: parseEnvBool(env.UBK_DISABLE_DEVTOOLS),
  noChromeSandbox: parseEnvBool(env.UBK_NO_CHROME_SANDBOX),
  disableGpu: parseEnvBool(env.UBK_DISABLE_GPU),
  defaultChromeId:
    env.UBK_DEFAULT_BROWSER_ID ||
    Object.keys(pkgJson.dependencies)
      .find(x => x.match(/^@ulixee\/chrome-\d+-0$/))
      ?.split('@ulixee/')
      ?.pop(),
  noRosettaChromeOnMac: parseEnvBool(env.UBK_NO_CHROME_ROSETTA),
};
