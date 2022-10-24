import * as Os from 'os';
import AgentEnv from '@unblocked-web/agent/env';
import { loadEnv, parseEnvBool, parseEnvPath } from '@ulixee/commons/lib/envUtils';

loadEnv(__dirname);

export default {
  disableMitm: parseEnvBool(process.env.ULX_DISABLE_MITM) ?? AgentEnv.disableMitm,
  showChrome: parseEnvBool(process.env.ULX_SHOW_CHROME) ?? AgentEnv.showChrome,
  disableDevtools: parseEnvBool(process.env.ULX_DISABLE_DEVTOOLS) ?? AgentEnv.disableDevtools,
  noChromeSandbox: parseEnvBool(process.env.ULX_NO_CHROME_SANDBOX) ?? AgentEnv.noChromeSandbox,
  disableGpu: parseEnvBool(process.env.ULX_DISABLE_GPU) ?? AgentEnv.disableGpu,
};

export const dataDir = parseEnvPath(process.env.ULX_DATA_DIR?.replace('<TMP>', Os.tmpdir));
